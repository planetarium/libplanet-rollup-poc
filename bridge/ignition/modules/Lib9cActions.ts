import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Lib9cActionsModule = buildModule("Lib9cActionsModule", (m) => {

  const auraSummonParser = m.contract("AuraSummonParser");
  const claimItemsParser = m.contract("ClaimItemsParser");
  const combinationEquipmentParser = m.contract("CombinationEquipmentParser");
  const dailyRewardParser = m.contract("DailyRewardParser");
  const exploreAdventureBossParser = m.contract("ExploreAdventureBossParser");
  const grindingParser = m.contract("GrindingParser");
  const hackAndSlashParser = m.contract("HackAndSlashParser");
  const hackAndSlashSweepParser = m.contract("HackAndSlashSweepParser");
  const rapidCombinationParser = m.contract("RapidCombinationParser");
  const transferAssetParser = m.contract("TransferAssetParser");

  return { 
    auraSummonParser, claimItemsParser, combinationEquipmentParser, dailyRewardParser, 
    exploreAdventureBossParser, grindingParser, hackAndSlashParser, hackAndSlashSweepParser, 
    rapidCombinationParser, transferAssetParser
  };
});

export default Lib9cActionsModule;