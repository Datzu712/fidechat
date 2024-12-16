import { type JSX, useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-bootstrap';

import ChannelFormModal from '@components/ChannelFormModal';
import { GlobalContext } from '@contexts/GlobalContext';

function Sidebar(): JSX.Element {
    const [showModal, setShowModal] = useState(false);
    const { currentUser, setSelectedChannel, selectedChannel, channels } =
        useContext(GlobalContext);

    const handleLogout = () => {
        fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
        })
            .then(() => {
                localStorage.removeItem('data');
                window.location.href = '/';
            })
            .catch(console.error);
    };

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
                    className="btn btn-secondary mb-1 btn-create-channel"
                    onClick={() => setShowModal(true)}
                >
                    Create Channel
                </button>
                <div className="mt-auto">
                    <hr className="bg-light" />
                    <div className="text-center">
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="btn-dark"
                                id="dropdown-basic"
                                className="border border-light"
                            >
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="me-2"
                                />
                                {currentUser?.name}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => alert('Logout')}>
                                    Logout
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => {
                                        alert('Settings');
                                    }}
                                >
                                    Settings
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <small className="text-muted d-block mt-2 fs-6">
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
