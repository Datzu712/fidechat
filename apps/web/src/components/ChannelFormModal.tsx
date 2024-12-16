import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useContext, useState } from 'react';
import { Row } from 'react-bootstrap';
import { createChannel } from '../services/api';
import { GlobalContext } from '../contexts/GlobalContext';

interface ChannelFormModalProps {
    readonly show: boolean;
    readonly handleClose: () => void;
}

function ChannelFormModal({ show, handleClose }: ChannelFormModalProps) {
    const [validated, setValidated] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const { currentUser } = useContext(GlobalContext);

    function handleCreateChannel(name: string, description: string) {
        createChannel({ name, description, ownerId: currentUser!.id });
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
            setValidated(true);
        } else {
            handleCreateChannel(channelName, channelDescription);
            handleClose();
            setChannelName('');
            setChannelDescription('');
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create Channel</Modal.Title>
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
                                onChange={(e) => setChannelName(e.target.value)}
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
                    Create Channel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ChannelFormModal;
