import { Module } from "@nestjs/common";
import { PreoracleService } from "./preoracle.service";

@Module({
  imports: [],
  providers: [PreoracleService],
  exports: [PreoracleService],
})
export class PreoracleModule {}