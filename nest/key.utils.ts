import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';

const os = require("os");
const path = require("path");
const fs = require("fs");
const keythereum = require("keythereum");

@Injectable()
export class KeyManager {
    constructor(private configure: ConfigService) {}

    public getPrivateKeyFromKeyStore(): `0x${string}` {
        return this.exportPrivateKeyFromKeyStore(
          this.configure.get('wallet.keystore.main.path', ''),
          this.configure.get('wallet.keystore.main.password', ''),
        );
    }

    public getSubPrivateKeyFromKeyStore(): `0x${string}` {
        return this.exportPrivateKeyFromKeyStore(
          this.configure.get('wallet.keystore.sub.path', ''),
          this.configure.get('wallet.keystore.sub.password', ''),
        );
    }

    private exportPrivateKeyFromKeyStore(keyStorePathFromHome: string, password: string): `0x${string}` {
        const HOME = os.homedir();
        const KEYSTORE = path.join(HOME, keyStorePathFromHome);
        const keyObject = JSON.parse(fs.readFileSync(KEYSTORE, "utf8"));
        const privateKey = keythereum.recover(password, keyObject).toString("hex");
        return '0x'.concat(privateKey) as `0x${string}`;
    }
}
