import { useContext, useState } from 'react';
import ChannelFormModal from './ChannelFormModal';
import type { IChannel, IExtendedChannel } from '../interfaces/channel';
import { GlobalContext } from '../contexts/GlobalContext';

interface SidebarProps {
    readonly channels: IExtendedChannel[];
    readonly selectedChannel: IChannel | null;
    readonly setSelectedChannel: (channel: IExtendedChannel | null) => void;
}

function Sidebar({
    channels,
    selectedChannel,
    setSelectedChannel,
}: SidebarProps): JSX.Element {
    const [showModal, setShowModal] = useState(false); // channel create modal
    const { currentUser } = useContext(GlobalContext);

    return (
        <>
            <div
                className="bg-dark text-white d-flex flex-column p-3 flex-shrink-0 sidebar"
                style={{ width: '250px' }}
            >
                <h5>Channels</h5>
                <ul className="list-unstyled flex-grow-1">
                    {channels.map((channel, index) => (
                        <li key={index} className="mb-2">
                            <button
                                className={`p-2 w-100 text-left ${selectedChannel?.id === channel.id ? 'bg-primary' : 'bg-dark-subtle'}`}
                                onClick={() => {
                                    if (selectedChannel?.id === channel.id) {
                                        setSelectedChannel(null);
                                    } else {
                                        setSelectedChannel(channel);
                                    }
                                }}
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedChannel(channel);
                                    }
                                }}
                            >
                                {channel.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    className="btn btn-secondary mb-3"
                    onClick={() => setShowModal(true)}
                >
                    Create Channel
                </button>
                <div className="mt-auto">
                    <hr className="bg-light" />
                    <div className="text-center">
                        <p className="mb-1">{currentUser?.name}</p>
                        <small className="text-muted">
                            {currentUser?.email}
                        </small>
                    </div>
                </div>
            </div>

            <ChannelFormModal
                show={showModal}
                handleClose={() => setShowModal(false)}
            />
        </>
    );
}

export default Sidebar;
