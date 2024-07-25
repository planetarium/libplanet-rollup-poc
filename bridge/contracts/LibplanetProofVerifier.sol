// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LibplanetProofVerifier {

    event ProofVerified(bytes txId, bool result, bytes stateRootHash, bytes proof, bytes key, bytes value);

    function verifyProof(
        bytes memory txId,
        bytes memory stateRootHash,
        bytes memory proof,
        bytes memory key,
        bytes memory value
    ) public returns (bool) {
        bool result = _callLibplanetVerifyProof(stateRootHash, proof, key, value);
        emit ProofVerified(txId, result, stateRootHash, proof, key, value);
        return result;
    }

    function _callLibplanetVerifyProof(
        bytes memory stateRootHash,
        bytes memory proof,
        bytes memory key,
        bytes memory value
    ) private view returns (bool) {
        address _addr = 0x0000000000000000000000000000000000000200;
        (bool ok, bytes memory out) = _addr.staticcall(abi.encode(stateRootHash, proof, key, value));
        require(ok, "Proof verification error");
        return abi.decode(out, (bool));
    }
}