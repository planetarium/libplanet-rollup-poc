import { Module } from "@nestjs/common";
import { ChallengerService } from "./challenger.service";
import { KeyUtils } from "src/utils/utils.key";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { ChallengerPropser } from "./challenger.proposer";
import { ProposerModule } from "src/proposer/proposer.module";

@Module({
  imports: [
    EvmModule, 
    LibplanetModule,
    ProposerModule,
  ],
  controllers: [],
  providers: [KeyUtils, ChallengerService, ChallengerPropser],
  exports: [ChallengerService],
})
export class ChallengerModule {}