import { Module } from "@nestjs/common";
import { PreoracleService } from "./preoracle.service";
import { LibplanetModule } from "src/libplanet/libplanet.module";

@Module({
  imports: [LibplanetModule],
  providers: [PreoracleService],
  exports: [PreoracleService],
})
export class PreoracleModule {}