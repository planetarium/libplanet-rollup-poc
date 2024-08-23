import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) {}

  @Get()
  @Render('index')
  async root() {
    var outputRootInfo = await this.appService.getLatestOutputRoots();
    var addressBalances = await this.appService.getBalancesForWeb();
    return { 
      outputRootInfo: outputRootInfo,
      addressBalances: addressBalances
    };
  }
}
