const os = require("os");
const path = require("path");
const fs = require("fs");
const keythereum = require("keythereum");

export const exportPrivateKeyFromKeyStore = (keyStorePathFromHome: string, password: string): `0x${string}` => {
    const HOME = os.homedir();
    const KEYSTORE = path.join(HOME, keyStorePathFromHome);
    const keyObject = JSON.parse(fs.readFileSync(KEYSTORE, "utf8"));
    const privateKey = keythereum.recover(password, keyObject).toString("hex");
    return '0x'.concat(privateKey) as `0x${string}`;
}
