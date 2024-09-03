import { Module } from "@nestjs/common";
import { DeriverModule } from "nest/deriver/deriver.module";
import { ProposerService } from "./proposer.service";

@Module({
    imports: [DeriverModule],
    providers: [ProposerService],
})
export class PropserModule {}