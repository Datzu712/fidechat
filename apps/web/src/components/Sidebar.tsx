import { useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faUserPlus,
    faEdit,
    faDeleteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-bootstrap';

import ChannelFormModal from '@components/ChannelFormModal';
import { GlobalContext } from '@contexts/GlobalContext';
import { ConfirmDialog } from '@components/ConfirmDialong';
import type { IExtendedChannel } from 'src/interfaces/channel';

function Sidebar() {
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] =
        useState<IExtendedChannel | null>(null);
    const [visible, setVisible] = useState(false);
    const { currentUser, setSelectedChannel, selectedChannel, channels } =
        useContext(GlobalContext);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        channel: IExtendedChannel;
    } | null>(null);

    const handleLogout = () => {
        fetch(import.meta.env.VITE_API_URL + '/api/auth/logout', {
            method: 'GET',
            credentials: 'include',
        })
            .then((res) => {
                if (res.ok) {
                    localStorage.removeItem('data');
                    window.location.href = '/login';
                }
            })
            .catch(console.error);
    };

    const handleContextMenuClose = () => {
        setContextMenu(null);
    };

    return (
        <>
            {contextMenu && (
                <Dropdown.Menu
                    show
                    className="position-absolute"
                    style={{
                        top: contextMenu.mouseY,
                        left: contextMenu.mouseX,
                        zIndex: 1000,
                    }}
                    onMouseLeave={handleContextMenuClose}
                >
                    <Dropdown.Item
                        onClick={() => {
                            /* Acción para opción 1 */
                            handleContextMenuClose();
                        }}
                    >
                        <FontAwesomeIcon className="me-1" icon={faUserPlus} />{' '}
                        Agregar personas
                    </Dropdown.Item>
                    {contextMenu.channel.ownerId === currentUser?.id && (
                        <Dropdown.Item
                            onClick={() => {
                                setEditingChannel(contextMenu.channel);
                                setShowModal(true);
                            }}
                        >
                            <FontAwesomeIcon className="me-1" icon={faEdit} />{' '}
                            Editar canal
                        </Dropdown.Item>
                    )}
                    {contextMenu.channel.ownerId === currentUser?.id && (
                        <Dropdown.Item
                            onClick={() => {
                                /* Acción para opción 2 */
                                handleContextMenuClose();
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faDeleteLeft}
                                className="me-1"
                            />{' '}
                            Eliminar canal
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            )}
            <ConfirmDialog
                show={visible}
                title="Log out"
                message="Are you sure you want to log out? You will be redirected to the login page."
                onCancel={() => setVisible(false)}
                onConfirm={handleLogout}
            />
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
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({
                                        mouseX: e.clientX - 2,
                                        mouseY: e.clientY - 4,
                                        channel: channel,
                                    });
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
                                <Dropdown.Item onClick={() => setVisible(true)}>
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
                handleClose={() => {
                    setShowModal(false);
                    setEditingChannel(null);
                }}
                editingChannel={editingChannel}
            />
        </>
    );
}

export default Sidebar;
