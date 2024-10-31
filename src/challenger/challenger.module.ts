import { Module } from "@nestjs/common";
import { ChallengerService } from "./challenger.service";
import { KeyUtils } from "src/utils/utils.key";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";

@Module({
  imports: [EvmModule, LibplanetModule],
  controllers: [],
  providers: [KeyUtils, ChallengerService],
})
export class ChallengerModule {}