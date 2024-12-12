import { Module } from "@nestjs/common";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { BridgeService } from "./bridge.service";
import { BridgeController } from "./bridge.controller";
import { ChallengerModule } from "src/challenger/challenger.module";

@Module({
  imports: [LibplanetModule, EvmModule, ChallengerModule],
  controllers: [BridgeController],
  providers: [BridgeService],
})
export class BridgeModule {}