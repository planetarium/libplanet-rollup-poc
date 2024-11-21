import { Module } from "@nestjs/common";
import { PreoracleDbService } from "./preoracle.db.service";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { EvmModule } from "src/evm/evm.module";
import { PreoracleContractService } from "./preoracle.contract.service";
import { KeyUtils } from "src/utils/utils.key";

@Module({
  imports: [LibplanetModule, EvmModule],
  providers: [PreoracleDbService, PreoracleContractService, KeyUtils],
  exports: [PreoracleDbService, PreoracleContractService],
})
export class PreoracleModule {}