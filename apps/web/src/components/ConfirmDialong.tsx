import { Button, Modal } from 'react-bootstrap';

interface ConfirmDialogProps {
    readonly show: boolean;
    readonly title: string;
    readonly message: string;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
}

export function ConfirmDialog({
    show,
    title,
    message,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal show={show} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
