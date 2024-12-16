import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useContext, useEffect, useState } from 'react';
import { Row } from 'react-bootstrap';
import { createChannel, updateChannel } from '../services/api';
import { GlobalContext } from '../contexts/GlobalContext';
import { IExtendedChannel } from 'src/interfaces/channel';
import StatusModal from './StatusModal';

interface ChannelFormModalProps {
    readonly show: boolean;
    readonly handleClose: () => void;
    readonly editingChannel: IExtendedChannel | null;
}

function ChannelFormModal({
    show,
    handleClose,
    editingChannel,
}: ChannelFormModalProps) {
    const [validated, setValidated] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const { currentUser } = useContext(GlobalContext);

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
            setValidated(true);
        } else {
            try {
                if (editingChannel) {
                    await updateChannel({
                        ...editingChannel,
                        name: channelName,
                        description: channelDescription,
                    });
                } else {
                    await createChannel({
                        name: channelName,
                        description: channelDescription,
                        ownerId: currentUser!.id,
                    });
                }
                setShowStatusModal(true);
            } catch (error) {
                console.log(error);
                setShowErrorModal(true);
            } finally {
                handleClose();
                setChannelName('');
                setChannelDescription('');
            }
        }
    };

    useEffect(() => {
        if (!editingChannel) return;

        setChannelName(editingChannel.name);
        setChannelDescription(editingChannel.description);
    }, [editingChannel]);

    return (
        <>
            {/* Todo: refactor this */}
            <StatusModal
                title="Error"
                description={`Could not ${editingChannel ? 'update' : 'create'} channel. Server error...`}
                show={showErrorModal}
                status="error"
                handleClose={() => setShowErrorModal(false)}
            />
            <StatusModal
                title="Success"
                description={`Channel ${editingChannel ? 'updated' : 'created'} successfully!`}
                show={showStatusModal}
                status="success"
                handleClose={() => setShowStatusModal(false)}
            />
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingChannel ? 'Editing' : 'Creating'} Channel
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        id="createChannelForm"
                        noValidate
                        validated={validated}
                        onSubmit={handleSubmit}
                    >
                        <Row className="mb-3">
                            <Form.Group controlId="channelName">
                                <Form.Label>Channel Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={channelName}
                                    onChange={(e) =>
                                        setChannelName(e.target.value)
                                    }
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please provide a valid channel name.
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group controlId="channelDescription">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    required
                                    as="textarea"
                                    value={channelDescription}
                                    onChange={(e) =>
                                        setChannelDescription(e.target.value)
                                    }
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please provide a valid description.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="createChannelForm"
                    >
                        {editingChannel ? 'Update' : 'Create'} Channel
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ChannelFormModal;
