import { Module } from "@nestjs/common";
import { ChallengerService } from "./challenger.service";
import { KeyUtils } from "src/utils/utils.key";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { ChallengerProposer } from "./challenger.proposer";
import { ProposerModule } from "src/proposer/proposer.module";
import { PreoracleModule } from "src/preoracle/preoracle.module";

@Module({
  imports: [
    EvmModule, 
    LibplanetModule,
    ProposerModule,
    PreoracleModule,
  ],
  controllers: [],
  providers: [KeyUtils, ChallengerService, ChallengerProposer],
  exports: [ChallengerService],
})
export class ChallengerModule {}