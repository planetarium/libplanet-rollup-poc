import { Module } from "@nestjs/common";
import { SESSION_STORE } from "./session.const";
import { MemoryStore } from "express-session";

@Module({
    providers: [
        {
            provide: SESSION_STORE,
            useFactory: () => {
                return new MemoryStore();
            }
        }
    ],
    exports: [SESSION_STORE]
})
export class SessionModule {}