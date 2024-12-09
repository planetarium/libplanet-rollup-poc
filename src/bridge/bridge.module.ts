import { Module } from "@nestjs/common";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { BridgeService } from "./bridge.service";
import { BridgeController } from "./bridge.controller";

@Module({
  imports: [LibplanetModule, EvmModule],
  controllers: [BridgeController],
  providers: [BridgeService],
})
export class BridgeModule {}