import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { FaultDisputeGame } from "bridge/typechain-types";
import { expect } from "chai";
import { EventLog } from "ethers";
import hre from "hardhat";

describe("FaultProof", function () {
  async function deployFaultDisputeGameFactory() {
    const FaultDisputeGameFactory = await hre.ethers.getContractFactory("FaultDisputeGameFactory");
    const faultDisputeGameFactory = await FaultDisputeGameFactory.deploy();

    return faultDisputeGameFactory;
  }

  async function deployAnchorStateRegistry(faultDisputeGameFactory: any) {
    const AnchorStateRegistry = await hre.ethers.getContractFactory("AnchorStateRegistry");
    const anchorStateRegistry = await AnchorStateRegistry.deploy(
      faultDisputeGameFactory.getAddress(),
      {
        root: "0x0000000000000000000000000000000000000000000000000000000000000001",
        l2BlockNumber: 0n
      }
    );

    return anchorStateRegistry;
  }

  async function deployFaultDisputeGame(anchorStateRegistry: any) {
    const FaultDisputeGame = await hre.ethers.getContractFactory("FaultDisputeGame");

    const maxGameDepth = 8n;
    const splitDepth = 4n;
    const maxClockDuration = 3600n;
    const clockExtension = 300n;
    const anchorStateRegistryAddress = anchorStateRegistry.getAddress();
    const faultDisputeGame = await FaultDisputeGame.deploy(
      maxGameDepth,
      splitDepth,
      maxClockDuration,
      clockExtension,
      anchorStateRegistry
    );

    return { maxClockDuration, faultDisputeGame };
  }

  async function deployFaultProofFixture() {
    const faultDisputeGameFactory = await deployFaultDisputeGameFactory();
    const anchorStateRegistry = await deployAnchorStateRegistry(faultDisputeGameFactory);
    const { maxClockDuration, faultDisputeGame } = await deployFaultDisputeGame(anchorStateRegistry);

    await faultDisputeGameFactory.setImplementation(faultDisputeGame.getAddress());

    const [owner, otherAccount] = await hre.ethers.getSigners();

    return { faultDisputeGameFactory, anchorStateRegistry, faultDisputeGame, owner, otherAccount, maxClockDuration };
  }

  describe("Deployment", function () {
    it("FaultDisputeGameFactory", async function(){
      const { faultDisputeGameFactory, faultDisputeGame } = await loadFixture(deployFaultProofFixture);

      expect(await faultDisputeGameFactory.faultDisputeGameImplementation()).to.equal(
        await faultDisputeGame.getAddress()
      );
    });

    it("AnchorStateRegistry", async function(){
      const { anchorStateRegistry, faultDisputeGameFactory } = await loadFixture(deployFaultProofFixture);

      expect(await anchorStateRegistry.faultDisputeGameFactory()).to.equal(
        await faultDisputeGameFactory.getAddress()
      );

      const anchor = await anchorStateRegistry.anchor();
      expect(anchor.root).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
      expect(anchor.l2BlockNumber).to.equal(0n);
    });

    it("FaultDisputeGame", async function(){
      const { faultDisputeGame, anchorStateRegistry } = await loadFixture(deployFaultProofFixture);

      expect(await faultDisputeGame.maxGameDepth()).to.equal(8n);
      expect(await faultDisputeGame.splitDepth()).to.equal(4n);
      expect(await faultDisputeGame.maxClockDuration()).to.equal(3600n);
      expect(await faultDisputeGame.clockExtension()).to.equal(300n);
      expect(await faultDisputeGame.anchorStateRegistry()).to.equal(
        await anchorStateRegistry.getAddress()
      );
    });
  });

  describe("game controle", function () {
    it("game controle", async function(){
      const { faultDisputeGameFactory, owner, otherAccount, maxClockDuration } = await loadFixture(deployFaultProofFixture);

      const rootClaim = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const l2BlockNumber = 1n;
      const tx = await faultDisputeGameFactory.create(rootClaim, l2BlockNumber);
      const receipt = await tx.wait();
      const eventLog = receipt?.logs[0] as EventLog;
      const proxy = eventLog.args[0] as string;
      const faultDisputeGame = await hre.ethers.getContractAt("FaultDisputeGame", proxy);

      expect(await faultDisputeGame.rootClaim()).to.equal(rootClaim);
      expect(await faultDisputeGame.l2BlockNumber()).to.equal(l2BlockNumber);
      expect(await faultDisputeGame.status()).to.equal(0);
      var claimData = await faultDisputeGame.claimData(0);
      expect(claimData.claim).to.equal(rootClaim);
      expect(claimData.position).to.equal(1);
      expect(claimData.claimant).to.equal(owner.address);

      const claim1 = "0x0000000000000000000000000000000000000000000000000000000000000003";
      await faultDisputeGame.connect(otherAccount).attack(rootClaim, 0n, claim1); // claim index 1
      var claimData = await faultDisputeGame.claimData(1);
      expect(claimData.claim).to.equal(claim1);
      expect(claimData.position).to.equal(2);
      expect(claimData.claimant).to.equal(otherAccount.address);

      const claim2 = "0x0000000000000000000000000000000000000000000000000000000000000004";
      await faultDisputeGame.connect(owner).defend(claim1, 1n, claim2); // claim index 2
      var claimData = await faultDisputeGame.claimData(2);
      expect(claimData.claim).to.equal(claim2);
      expect(claimData.position).to.equal(6);
      expect(claimData.claimant).to.equal(owner.address);

      await faultDisputeGame.connect(otherAccount).attack(claim1, 1n, claim2); // claim index 3
      await faultDisputeGame.connect(owner).defend(claim2, 3n, claim2); // claim index 4

      expect(await faultDisputeGame.getNumToResolve(0n)).to.equal(1);
      expect(await faultDisputeGame.getNumToResolve(1n)).to.equal(2);
      expect(await faultDisputeGame.getNumToResolve(2n)).to.equal(0);
      expect(await faultDisputeGame.getNumToResolve(3n)).to.equal(1);

      await expect(faultDisputeGame.connect(owner).move(claim1, 1n, claim2, false))
        .to.be.revertedWithCustomError(faultDisputeGame, "ClaimAlreadyExists");

      await faultDisputeGame.connect(otherAccount).defend(claim2, 4n, claim2); // claim index 5
      await faultDisputeGame.connect(owner).attack(claim2, 5n, claim2); // claim index 6
      await faultDisputeGame.connect(otherAccount).attack(claim2, 2n, claim2); // claim index 7
      await faultDisputeGame.connect(owner).attack(claim2, 7n, claim2); // claim index 8

      const claim3 = "0x0000000000000000000000000000000000000000000000000000000000000005";
      await faultDisputeGame.connect(otherAccount).attack(claim2, 5n, claim3); // claim index 9
      await faultDisputeGame.connect(owner).attack(claim3, 9n, claim3); // claim index 10

      const claimDataLen = await faultDisputeGame.claimDataLen();
      expect(claimDataLen).to.equal(11);

      for (let i = claimDataLen - 1n; i >= 0n; i--) {
        await expect(faultDisputeGame.resolveClaim(i))
          .to.be.revertedWithCustomError(faultDisputeGame, "ClockNotExpired");
      }

      await time.increase(maxClockDuration + 1n);
      for (let i = claimDataLen - 1n; i >= 0n; i--) {
        await faultDisputeGame.resolveClaim(i);
      }

      await faultDisputeGame.resolve();

      expect(await faultDisputeGame.status()).to.equal(2);
    });
  });
});