import { ChannelID } from "./deriver.types";

export const channelIdToHexKey = (id: ChannelID): string => {
    return Buffer.from(id).toString("hex");
}