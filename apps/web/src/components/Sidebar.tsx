import { useContext, useState } from 'react';
import ChannelFormModal from './ChannelFormModal';
import { UserContext } from '../contexts/UserContext';
import type { IChannel } from '../interfaces/channel';

interface SidebarProps {
    readonly channels: IChannel[];
    readonly selectedChannel: IChannel | null;
    readonly setSelectedChannel: (channel: IChannel) => void;
}

function Sidebar({
    channels,
    selectedChannel,
    setSelectedChannel,
}: SidebarProps): JSX.Element {
    const [showModal, setShowModal] = useState(false); // channel create modal
    const currentUser = useContext(UserContext);

    return (
        <>
            <div
                className="bg-dark text-white d-flex flex-column p-3"
                style={{ width: '250px' }}
            >
                <h5>Channels</h5>
                <ul className="list-unstyled flex-grow-1">
                    {channels.map((channel, index) => (
                        <li key={index} className="mb-2">
                            <button
                                className={`p-2 w-100 text-left ${selectedChannel?.id === channel.id ? 'bg-primary' : 'bg-dark-subtle'}`}
                                onClick={() => setSelectedChannel(channel)}
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
                        <p className="mb-1">{currentUser.name}</p>
                        <small className="text-muted">
                            {currentUser.email}
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
