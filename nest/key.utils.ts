import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { toHex } from "viem";
import { secp256k1 } from '@noble/curves/secp256k1'
import { publicKeyToAddress } from "viem/utils";
import { privateKeyToAddress } from "viem/accounts";

@Injectable()
export class KeyManager {
    constructor(private configure: ConfigService) {}

    public getBatcherPrivateKey(): `0x${string}` {
        return this.configure.get('wallet.batcher_private_key', '0x');
    }

    public getBatcherAddress(): `0x${string}` {
        return privateKeyToAddress(this.getBatcherPrivateKey());
    }

    public getProposerPrivateKey(): `0x${string}` {
        return this.configure.get('wallet.proposer_private_key', '0x');
    }

    public getProposerAddress(): `0x${string}` {
        return privateKeyToAddress(this.getProposerPrivateKey());
    }

    public getMainPrivateKey(): `0x${string}` {
        return this.configure.get('wallet.main_private_key', '0x');
    }

    public getMainAddress(): `0x${string}` {
        return privateKeyToAddress(this.getMainPrivateKey());
    }

    public getSubPrivateKey(): `0x${string}` {
        return this.configure.get('wallet.sub_private_key', '0x');
    }

    public getSubAddress(): `0x${string}` {
        return privateKeyToAddress(this.getSubPrivateKey());
    }
}
