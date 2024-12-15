import { useContext } from 'react';
import { GlobalContext } from '../contexts/GlobalContext';

function ChannelHeader() {
    const { selectedChannel } = useContext(GlobalContext);

    if (!selectedChannel) {
        return null;
    }

    return (
        <header className="channel-header d-flex justify-content-between">
            <h3 className="channel-title">{'# ' + selectedChannel.name}</h3>
            <aside className="channel-description mb-0">
                {selectedChannel.description}
            </aside>
        </header>
    );
}

export default ChannelHeader;
