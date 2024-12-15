import { type JSX, useContext, useState } from 'react';
import ChannelFormModal from './ChannelFormModal';
import { GlobalContext } from '../contexts/GlobalContext';

function Sidebar(): JSX.Element {
    console.log('Sidebar rendered');

    const [showModal, setShowModal] = useState(false);
    const { currentUser, setSelectedChannel, selectedChannel, channels } =
        useContext(GlobalContext);

    return (
        <>
            <nav className="sidebar p-1">
                <h2 className="text-center">Fidechat</h2>
                <h5 className="mt-4 ms-1">Channels</h5>
                <ul className="list-unstyled flex-grow-1 overflow-auto ms-1">
                    {channels.map((channel, index) => (
                        <li key={index} className="mb-2">
                            <button
                                className={`p-2 w-100 btn-channel text-left rounded ${selectedChannel?.id === channel.id ? 'bg-secondary selected' : 'bg-body-secondary'}`}
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
                    className="btn btn-secondary mb-3 btn-create-channel"
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
            </nav>

            <ChannelFormModal
                show={showModal}
                handleClose={() => setShowModal(false)}
            />
        </>
    );
}

export default Sidebar;
