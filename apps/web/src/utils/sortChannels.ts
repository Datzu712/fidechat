import type { IExtendedChannel } from '../interfaces/channel';

export function sortChannels(channels: IExtendedChannel[]) {
    return channels.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
}
