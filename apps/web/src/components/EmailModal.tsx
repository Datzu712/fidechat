import { GlobalContext } from '@contexts/GlobalContext';
import { useContext, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

interface EmailModalProps {
    readonly show: boolean;
    readonly handleClose: () => void;
    readonly channelId: string | null;
}

function EmailModal({ show, handleClose, channelId }: EmailModalProps) {
    const [email, setEmail] = useState('');
    const { toastMessages, setToastMessages } = useContext(GlobalContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelId) {
            setToastMessages([
                ...toastMessages,
                {
                    bg: 'danger',
                    message: 'Channel ID is missing',
                    delay: 5000,
                },
            ]);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/channels/${channelId}/members/${email}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );

            const result = await response.json();
            if (result.message === 'success') {
                setToastMessages([
                    ...toastMessages,
                    {
                        bg: 'success',
                        message: 'User added successfully',
                        delay: 5000,
                    },
                ]);
            } else {
                setToastMessages([
                    ...toastMessages,
                    {
                        bg: 'danger',
                        message: 'Error adding user',
                        delay: 5000,
                    },
                ]);
            }
        } catch (error) {
            console.error('Error:', error);
            setToastMessages([
                ...toastMessages,
                {
                    bg: 'danger',
                    message: 'An error occurred',
                    delay: 5000,
                },
            ]);
        }

        setEmail('');
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Enter Email</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="mt-3">
                        Submit
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default EmailModal;
