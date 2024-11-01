import { Module } from "@nestjs/common";
import { ChainManager } from "./evm.chains";
import { EvmContractManager } from "./evm.contracts";
import { EvmEventListener } from "./evm.event.listener";
import { KeyUtils } from "src/utils/utils.key";
import { EvmController } from "./evm.controller";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";
import { MutexModule } from "src/mutex/mutex.module";
import { EvmService } from "./evm.service";

@Module({
  imports: [MutexModule],
  controllers: [EvmController],
  providers: [KeyUtils, ChainManager, EvmContractManager, EvmEventListener, 
    EvmClientFactory, EvmPublicService, EvmService],
  exports: [EvmContractManager, EvmClientFactory, EvmPublicService, EvmService],
})
export class EvmModule {}