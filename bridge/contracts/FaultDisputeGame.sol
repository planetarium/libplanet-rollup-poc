// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IFaultDisputeGame } from "./interfaces/IFaultDisputeGame.sol";
import { IAnchorStateRegistry } from "./interfaces/IAnchorStateRegistry.sol";

import { Clone } from "./utils/Clone.sol";

import "./utils/Types.sol";
import "./utils/Errors.sol";

import "hardhat/console.sol";

contract FaultDisputeGame is IFaultDisputeGame, Clone {
    uint256 internal immutable MAX_GAME_DEPTH;
    uint256 internal immutable SPLIT_DEPTH;
    Duration internal immutable MAX_CLOCK_DURATION;
    Duration internal immutable CLOCK_EXTENSION;
    IAnchorStateRegistry internal immutable ANCHOR_STATE_REGISTRY;
    Position internal immutable ROOT_POSITION = Position.wrap(1);
    Timestamp public createdAt;
    Timestamp public resolvedAt;
    GameStatus public status;
    bool internal initialized;
    ClaimData[] public claimData;
    mapping(Hash => bool) public claims;
    mapping(uint256 => uint256[]) public subgames;
    mapping(uint256 => bool) public resolvedSubgames;
    mapping(uint256 => ResolutionCheckpoint) public resolutionCheckpoints;
    OutputRoot public startingOutputRoot;

    constructor(
        uint256 _maxGameDepth,
        uint256 _splitDepth,
        Duration _maxClockDuration,
        Duration _clockExtension,
        IAnchorStateRegistry _anchorStateRegistry
    ) {
        if (_splitDepth >= _maxGameDepth) revert InvalidSplitDepth();
        if (_clockExtension.raw() >= _maxClockDuration.raw()) revert InvalidClockExtension();

        MAX_GAME_DEPTH = _maxGameDepth;
        SPLIT_DEPTH = _splitDepth;
        MAX_CLOCK_DURATION = _maxClockDuration;
        CLOCK_EXTENSION = _clockExtension;
        ANCHOR_STATE_REGISTRY = IAnchorStateRegistry(_anchorStateRegistry);
    }    

    function initialize() external {
        if(initialized) revert AlreadyInitialized();

        (Hash root, uint256 rootBlockNumber) = ANCHOR_STATE_REGISTRY.anchor();

        if (root.raw() == bytes32(0)) revert AnchorRootNotFound();

        startingOutputRoot = OutputRoot(root, rootBlockNumber);

        if (l2BlockNumber() <= rootBlockNumber) revert UnexpectedRootClaim(rootClaim());

        claimData.push(
            ClaimData({
                parentIndex: type(uint32).max,
                counteredBy: address(0),
                claimant: gameCreator(),
                bond: 0,
                claim: rootClaim(),
                position: ROOT_POSITION,
                clock: LibClock.wrap(Duration.wrap(0), Timestamp.wrap(uint64(block.timestamp)))
            })
        );

        initialized = true;

        createdAt = Timestamp.wrap(uint64(block.timestamp));
    }

    function step(
        uint256 _claimIndex,
        bool _isAttack
    ) public {
        if (status != GameStatus.IN_PROGRESS) revert GameNotInProgress();

        // Get the parent. If it does not exist, the call will revert with OOB.
        ClaimData storage parent = claimData[_claimIndex];

        // Pull the parent position out of storage.
        Position parentPos = parent.position;
        // Determine the position of the step.
        Position stepPos = parentPos.move(_isAttack);

        // INVARIANT: A step cannot be made unless the move position is 1 below the `MAX_GAME_DEPTH`
        if (stepPos.depth() != MAX_GAME_DEPTH + 1) revert InvalidParent();

        // Determine the expected pre & post states of the step.
        Claim preStateClaim;
        ClaimData storage postState;
        if (_isAttack) {
            // If the step position's index at depth is 0, the prestate is the absolute
            // prestate.
            // If the step is an attack at a trace index > 0, the prestate exists elsewhere in
            // the game state.
            // NOTE: We localize the `indexAtDepth` for the current execution trace subgame by finding
            //       the remainder of the index at depth divided by 2 ** (MAX_GAME_DEPTH - SPLIT_DEPTH),
            //       which is the number of leaves in each execution trace subgame. This is so that we can
            //       determine whether or not the step position is represents the `ABSOLUTE_PRESTATE`.
            preStateClaim = stepPos.indexAtDepth() == 0
                ? Claim.wrap(startingRootHash().raw())
                : _findTraceAncestor(Position.wrap(parentPos.raw() - 1), parent.parentIndex).claim;
            // For all attacks, the poststate is the parent claim.
            postState = parent;
        } else {
            // If the step is a defense, the poststate exists elsewhere in the game state,
            // and the parent claim is the expected pre-state.
            preStateClaim = parent.claim;
            postState = _findTraceAncestor(Position.wrap(parentPos.raw() + 1), parent.parentIndex);
        }

        parent.counteredBy = msg.sender;
    }

    function move(
        Claim _disputed,
        uint256 _challengeIndex,
        Claim _claim,
        bool _isAttack
    ) public {
        if (status != GameStatus.IN_PROGRESS) revert GameNotInProgress();

        ClaimData memory parent = claimData[_challengeIndex];

        if (Claim.unwrap(parent.claim) != Claim.unwrap(_disputed)) revert InvalidDisputedClaimIndex();

        Position parentPos = parent.position;
        Position nextPosition = parentPos.move(_isAttack);
        uint256 nextPositionDepth = nextPosition.depth();

        if ((_challengeIndex == 0 || nextPositionDepth == SPLIT_DEPTH + 1) && !_isAttack) {
            revert CannotDefendRootClaim();
        }

        if (nextPositionDepth > MAX_GAME_DEPTH) revert GameDepthExceeded();

        Duration nextDuration = getChallengerDuration(_challengeIndex);

        if (nextDuration.raw() == MAX_CLOCK_DURATION.raw()) revert ClockTimeExceeded();

        if (nextDuration.raw() > MAX_CLOCK_DURATION.raw() - CLOCK_EXTENSION.raw()) {
            nextDuration = Duration.wrap(MAX_CLOCK_DURATION.raw() - CLOCK_EXTENSION.raw());
        }

        Clock nextClock = LibClock.wrap(nextDuration, Timestamp.wrap(uint64(block.timestamp)));

        Hash claimHash = _claim.hashClaimPos(nextPosition, _challengeIndex);
        if (claims[claimHash]) revert ClaimAlreadyExists();
        claims[claimHash] = true;

        claimData.push(
            ClaimData({
                parentIndex: uint32(_challengeIndex),
                counteredBy: address(0),
                claimant: msg.sender,
                bond: 0,
                claim: _claim,
                position: nextPosition,
                clock: nextClock
            })
        );

        subgames[_challengeIndex].push(claimData.length - 1);

        emit Move(_challengeIndex, _claim, msg.sender);
    }

    function attack(Claim _disputed, uint256 _parentIndex, Claim _claim) external {
        move(_disputed, _parentIndex, _claim, true);
    }

    function defend(Claim _disputed, uint256 _parentIndex, Claim _claim) external {
        move(_disputed, _parentIndex, _claim, false);
    }

    function getNumToResolve(uint256 _claimIndex) public view returns (uint256 numRemainingChildren_) {
        ResolutionCheckpoint storage checkpoint = resolutionCheckpoints[_claimIndex];
        uint256 challengeIndicesLen = subgames[_claimIndex].length;

        numRemainingChildren_ = challengeIndicesLen - checkpoint.subgameIndex;
    }

    function resolve() external returns (GameStatus status_) {
        // INVARIANT: Resolution cannot occur unless the game is currently in progress.
        if (status != GameStatus.IN_PROGRESS) revert GameNotInProgress();

        // INVARIANT: Resolution cannot occur unless the absolute root subgame has been resolved.
        if (!resolvedSubgames[0]) revert OutOfOrderResolution();

        // Update the global game status; The dispute has concluded.
        status_ = claimData[0].counteredBy == address(0) ? GameStatus.DEFENDER_WINS : GameStatus.CHALLENGER_WINS;
        resolvedAt = Timestamp.wrap(uint64(block.timestamp));

        // Update the status and emit the resolved event, note that we're performing an assignment here.
        emit Resolved(l2BlockNumber(), rootClaim(), status = status_);

        // Try to update the anchor state, this should not revert.
        ANCHOR_STATE_REGISTRY.tryUpdateAnchorState();
    }

    function resolveClaim(uint256 _claimIndex) external {
        // INVARIANT: Resolution cannot occur unless the game is currently in progress.
        if (status != GameStatus.IN_PROGRESS) revert ("GameNotInProgress();");

        ClaimData storage subgameRootClaim = claimData[_claimIndex];
        Duration challengeClockDuration = getChallengerDuration(_claimIndex);

        // INVARIANT: Cannot resolve a subgame unless the clock of its would-be counter has expired
        // INVARIANT: Assuming ordered subgame resolution, challengeClockDuration is always >= MAX_CLOCK_DURATION if all
        // descendant subgames are resolved
        if (challengeClockDuration.raw() < MAX_CLOCK_DURATION.raw()) revert ("ClockNotExpired();");

        // INVARIANT: Cannot resolve a subgame twice.
        if (resolvedSubgames[_claimIndex]) revert ("ClaimAlreadyResolved();");

        uint256 numToResolve = getNumToResolve(_claimIndex);

        uint256[] storage challengeIndices = subgames[_claimIndex];
        uint256 challengeIndicesLen = challengeIndices.length;

        // Uncontested claims are resolved implicitly unless they are the root claim. Pay out the bond to the claimant
        // and return early.
        if (challengeIndicesLen == 0 && _claimIndex != 0) {
            // In the event that the parent claim is at the max depth, there will always be 0 subgames. If the
            // `counteredBy` field is set and there are no subgames, this implies that the parent claim was successfully
            // stepped against. In this case, we pay out the bond to the party that stepped against the parent claim.
            // Otherwise, the parent claim is uncontested, and the bond is returned to the claimant.
            address counteredBy = subgameRootClaim.counteredBy;
            address recipient = counteredBy == address(0) ? subgameRootClaim.claimant : counteredBy;
            _distributeBond(recipient, subgameRootClaim);
            resolvedSubgames[_claimIndex] = true;
            return;
        }

        // Fetch the resolution checkpoint from storage.
        ResolutionCheckpoint memory checkpoint = resolutionCheckpoints[_claimIndex];

        // If the checkpoint does not currently exist, initialize the current left most position as max u128.
        if (!checkpoint.initialCheckpointComplete) {
            checkpoint.leftmostPosition = Position.wrap(type(uint128).max);
            checkpoint.initialCheckpointComplete = true;

            // If `_numToResolve == 0`, assume that we can check all child subgames in this one callframe.
            if (numToResolve == 0) numToResolve = challengeIndicesLen;
        }

        // Assume parent is honest until proven otherwise
        uint256 lastToResolve = checkpoint.subgameIndex + numToResolve;
        uint256 finalCursor = lastToResolve > challengeIndicesLen ? challengeIndicesLen : lastToResolve;
        for (uint256 i = checkpoint.subgameIndex; i < finalCursor; i++) {
            uint256 challengeIndex = challengeIndices[i];

            // INVARIANT: Cannot resolve a subgame containing an unresolved claim
            if (!resolvedSubgames[challengeIndex]) revert ("OutOfOrderResolution();");

            ClaimData storage claim = claimData[challengeIndex];

            // If the child subgame is uncountered and further left than the current left-most counter,
            // update the parent subgame's `countered` address and the current `leftmostCounter`.
            // The left-most correct counter is preferred in bond payouts in order to discourage attackers
            // from countering invalid subgame roots via an invalid defense position. As such positions
            // cannot be correctly countered.
            // Note that correctly positioned defense, but invalid claimes can still be successfully countered.
            if (claim.counteredBy == address(0) && checkpoint.leftmostPosition.raw() > claim.position.raw()) {
                checkpoint.counteredBy = claim.claimant;
                checkpoint.leftmostPosition = claim.position;
            }
        }

        // Increase the checkpoint's cursor position by the number of children that were checked.
        checkpoint.subgameIndex = uint32(finalCursor);

        // Persist the checkpoint and allow for continuing in a separate transaction, if resolution is not already
        // complete.
        resolutionCheckpoints[_claimIndex] = checkpoint;

        // If all children have been traversed in the above loop, the subgame may be resolved. Otherwise, persist the
        // checkpoint and allow for continuation in a separate transaction.
        if (checkpoint.subgameIndex == challengeIndicesLen) {
            address countered = checkpoint.counteredBy;

            // Mark the subgame as resolved.
            resolvedSubgames[_claimIndex] = true;

            // If the parent was not successfully countered, pay out the parent's bond to the claimant.
            // If the parent was successfully countered, pay out the parent's bond to the challenger.
            _distributeBond(countered == address(0) ? subgameRootClaim.claimant : countered, subgameRootClaim);

            // Once a subgame is resolved, we percolate the result up the DAG so subsequent calls to
            // resolveClaim will not need to traverse this subgame.
            subgameRootClaim.counteredBy = countered;
        }
    }

    function getChallengerDuration(uint256 _claimIndex) public view returns (Duration duration_) {
        // INVARIANT: The game must be in progress to query the remaining time to respond to a given claim.
        if (status != GameStatus.IN_PROGRESS) {
            revert GameNotInProgress();
        }

        // Fetch the subgame root claim.
        ClaimData storage subgameRootClaim = claimData[_claimIndex];

        // Fetch the parent of the subgame root's clock, if it exists.
        Clock parentClock;
        if (subgameRootClaim.parentIndex != type(uint32).max) {
            parentClock = claimData[subgameRootClaim.parentIndex].clock;
        }

        // Compute the duration elapsed of the potential challenger's clock.
        uint64 challengeDuration =
            uint64(parentClock.duration().raw() + (block.timestamp - subgameRootClaim.clock.timestamp().raw()));
        duration_ = challengeDuration > MAX_CLOCK_DURATION.raw() ? MAX_CLOCK_DURATION : Duration.wrap(challengeDuration);
    }

    function _distributeBond(address _recipient, ClaimData storage _bonded) internal {
        // todo: implement
    }

    function gameData() public pure returns (Claim rootClaim_, uint256 l2BlockNumber_) {
        rootClaim_ = rootClaim();
        l2BlockNumber_ = l2BlockNumber();
    }

    function startingBlockNumber() external view returns (uint256 startingBlockNumber_) {
        startingBlockNumber_ = startingOutputRoot.l2BlockNumber;
    }

    function startingRootHash() public view returns (Hash startingRootHash_) {
        startingRootHash_ = startingOutputRoot.root;
    }

    function gameCreator() public pure returns (address creator_) {
        creator_ = _getArgAddress(0x00);
    }

    function rootClaim() public pure returns (Claim rootClaim_) {
        rootClaim_ = Claim.wrap(_getArgBytes32(0x14));
    }

    function l2BlockNumber() public pure returns (uint256 l2BlockNumber_) {
        l2BlockNumber_ = _getArgUint256(0x54);
    }

    function maxGameDepth() external view returns (uint256 maxGameDepth_) {
        maxGameDepth_ = MAX_GAME_DEPTH;
    }

    function splitDepth() external view returns (uint256 splitDepth_) {
        splitDepth_ = SPLIT_DEPTH;
    }

    function maxClockDuration() external view returns (Duration maxClockDuration_) {
        maxClockDuration_ = MAX_CLOCK_DURATION;
    }

    function clockExtension() external view returns (Duration clockExtension_) {
        clockExtension_ = CLOCK_EXTENSION;
    }

    function anchorStateRegistry() external view returns (IAnchorStateRegistry registry_) {
        registry_ = ANCHOR_STATE_REGISTRY;
    }

    function claimDataLen() external view returns (uint256 len_) {
        len_ = claimData.length;
    }

    function subgamesLen(uint256 _claimIndex) external view returns (uint256 len_) {
        len_ = subgames[_claimIndex].length;
    }

    function _findTraceAncestor(
        Position _pos,
        uint256 _start
    )
        internal
        view
        returns (ClaimData storage ancestor_)
    {
        // Grab the trace ancestor's expected position.
        Position traceAncestorPos = _pos.traceAncestor();

        // Walk up the DAG to find a claim that commits to the same trace index as `_pos`. It is
        // guaranteed that such a claim exists.
        ancestor_ = claimData[_start];
        while (ancestor_.position.raw() != traceAncestorPos.raw()) {
            ancestor_ = claimData[ancestor_.parentIndex];
        }
    }
}