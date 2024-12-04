import { time, loadFixture, mine } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { FaultDisputeGame } from "bridge/typechain-types";
import { expect } from "chai";
import { EventLog } from "ethers";
import hre from "hardhat";
import { ClaimData, claimDataWrap } from "./utils/type";
import { Position } from "./utils/position";

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
        root: "0xb725841ac078ee2a313cee3d9dede3492cc61e3a5439f2bcb289fc5b89d71d99",
        l2BlockNumber: 10n
      }
    );

    return anchorStateRegistry;
  }

  async function deployPreOracleVM() {
    const PreOracleVM = await hre.ethers.getContractFactory("PreOracleVM");
    const framePreInfoSize = 22n;
    const framePostInfoSize = 1n;

    const preOracleVM = await PreOracleVM.deploy(
      framePreInfoSize,
      framePostInfoSize
    );

    return preOracleVM;
  }

  async function deployFaultDisputeGame(anchorStateRegistry: any, preOracleVM: any) {
    const FaultDisputeGame = await hre.ethers.getContractFactory("FaultDisputeGame");

    const maxGameDepth = 20n;
    const splitDepth = 14n;
    const maxClockDuration = 120n;
    const clockExtension = 40n;

    const faultDisputeGame = await FaultDisputeGame.deploy(
      maxGameDepth,
      splitDepth,
      maxClockDuration,
      clockExtension,
      anchorStateRegistry,
      preOracleVM
    );

    return { maxClockDuration, faultDisputeGame };
  }

  async function deployFaultProofFixture() {
    const faultDisputeGameFactory = await deployFaultDisputeGameFactory();
    const anchorStateRegistry = await deployAnchorStateRegistry(faultDisputeGameFactory);
    const preOracleVM = await deployPreOracleVM();
    const { maxClockDuration, faultDisputeGame } = await deployFaultDisputeGame(anchorStateRegistry, preOracleVM);

    await faultDisputeGameFactory.setImplementation(faultDisputeGame.getAddress());

    const [owner, otherAccount] = await hre.ethers.getSigners();

    return { faultDisputeGameFactory, anchorStateRegistry, faultDisputeGame, preOracleVM, owner, otherAccount, maxClockDuration };
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
      expect(anchor.root).to.equal("0xb725841ac078ee2a313cee3d9dede3492cc61e3a5439f2bcb289fc5b89d71d99");
      expect(anchor.l2BlockNumber).to.equal(10n);
    });

    it("FaultDisputeGame", async function(){
      const { faultDisputeGame, anchorStateRegistry } = await loadFixture(deployFaultProofFixture);

      expect(await faultDisputeGame.maxGameDepth()).to.equal(20n);
      expect(await faultDisputeGame.splitDepth()).to.equal(14n);
      expect(await faultDisputeGame.maxClockDuration()).to.equal(120n);
      expect(await faultDisputeGame.clockExtension()).to.equal(40n);
      expect(await faultDisputeGame.anchorStateRegistry()).to.equal(
        await anchorStateRegistry.getAddress()
      );
    });
  });

  describe("game controle", function () {
    it("preoracle", async function(){
      const { preOracleVM } = await loadFixture(deployFaultProofFixture);

      const res = await preOracleVM.step(
        "0x000000000000000000000000000000000000000000000000000000000000000b",
        11n,
        0n,
        "0xf84580a03cea38f5e30b2fa5745dd0eb2151c4ef65ddf4d7547a4bcf118cb18294f0368780a03cea38f5e30b2fa5745dd0eb2151c4ef65ddf4d7547a4bcf118cb18294f0368745"
      )

      console.log(res);
    });

    it("game controle", async function(){
      const { faultDisputeGameFactory, owner, otherAccount, maxClockDuration } = await loadFixture(deployFaultProofFixture);

      const rootClaim = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const l2BlockNumber = 15n;
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
          .to.be.revertedWith("ClockNotExpired();");
      }

      await time.increase(maxClockDuration + 1n);
      for (let i = claimDataLen - 1n; i >= 0n; i--) {
        await faultDisputeGame.resolveClaim(i);
      }

      await faultDisputeGame.resolve();

      expect(await faultDisputeGame.status()).to.equal(2);
    });

    it("game controle2", async function(){
      const { faultDisputeGameFactory, owner, otherAccount, maxClockDuration } = await loadFixture(deployFaultProofFixture);

      await mine(1000);

      const rootClaim = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const l2BlockNumber = 200n;
      const tx = await faultDisputeGameFactory.create(rootClaim, l2BlockNumber);
      const receipt = await tx.wait();
      const eventLog = receipt?.logs[0] as EventLog;
      const proxy = eventLog.args[0] as string;
      const faultDisputeGame = await hre.ethers.getContractAt("FaultDisputeGame", proxy);

      expect(await faultDisputeGame.rootClaim()).to.equal(rootClaim);
      expect(await faultDisputeGame.l2BlockNumber()).to.equal(l2BlockNumber);
      expect(await faultDisputeGame.status()).to.equal(0);
      var rootClaimData = await faultDisputeGame.claimData(0);
      expect(rootClaimData.claim).to.equal(rootClaim);
      expect(rootClaimData.position).to.equal(1);
      expect(rootClaimData.claimant).to.equal(owner.address);

      for(let i = 0; i < 20; i++) {
        await faultDisputeGame.connect(owner).attack(rootClaim, BigInt(i), rootClaim);
      }

      const claimDataLen = await faultDisputeGame.claimDataLen();
      expect(claimDataLen).to.equal(21);

      const claimData = await faultDisputeGame.claimData(claimDataLen - 1n);
      const claimDataPosition = new Position(claimData.position);
      expect(claimDataPosition.depth()).to.equal(20);

      const batchIndexDataHex = '111';
      const batchIndexData = Buffer.from(batchIndexDataHex, 'hex');

      expect(await faultDisputeGame.maxGameDepth()).to.equal(20n);
      const res = await faultDisputeGame.step(claimDataLen - 1n, true, batchIndexData);
    });
  });
});