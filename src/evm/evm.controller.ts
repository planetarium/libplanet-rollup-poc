import { Controller, Get, Logger, Param, Query } from "@nestjs/common";
import { EvmService } from "./evm.service";

@Controller("evm")
export class EvmController {
  constructor(
    private readonly EvmService: EvmService,
  ) {}

  private readonly logger = new Logger(EvmController.name);

  @Get("make-new-wallet")
  async makeNewWallet() {
    return await this.EvmService.makeNewWallet();
  }
}