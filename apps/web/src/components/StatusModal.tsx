import '@scss/components/_statusModal.scss';

import { Button, Modal } from 'react-bootstrap';

interface SuccessModalProps {
    readonly show: boolean;
    readonly handleClose?: () => void;
    readonly title: string;
    readonly description: string;
    readonly status: 'error' | 'success';
}

function StatusModal({
    show,
    handleClose,
    title,
    description,
    status,
}: SuccessModalProps) {
    const isError = status === 'error';
    const strokeColor = isError ? '#db3646' : '#198754';
    const titleClass = isError ? 'text-danger' : 'text-success';
    const buttonVariant = isError ? 'danger' : 'success';

    const idSelector = isError ? 'statusErrorsModal' : 'statusSuccessModal';

    return (
        <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
            centered
            size="sm"
            id={idSelector}
            animation={true}
        >
            <Modal.Body className="text-center p-lg-4 modal-content">
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 130.2 130.2"
                >
                    <circle
                        className="path circle"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeMiterlimit="10"
                        cx="65.1"
                        cy="65.1"
                        r="62.1"
                    />
                    {isError ? (
                        <>
                            <line
                                className="path line"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeMiterlimit="10"
                                x1="34.4"
                                y1="37.9"
                                x2="95.8"
                                y2="92.3"
                            />
                            <line
                                className="path line"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeMiterlimit="10"
                                x1="95.8"
                                y1="38"
                                x2="34.4"
                                y2="92.2"
                            />
                        </>
                    ) : (
                        <polyline
                            className="path check"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeMiterlimit="10"
                            points="100.2,40.2 51.5,88.8 29.8,67.5 "
                        />
                    )}
                </svg>
                <h4 className={`${titleClass} mt-3`}>{title}</h4>
                <p className="mt-3">{description}</p>
                <Button
                    variant={buttonVariant}
                    size="sm"
                    className="mt-3"
                    onClick={handleClose}
                >
                    {isError ? 'Close' : 'Ok'}
                </Button>
            </Modal.Body>
        </Modal>
    );
}

export default StatusModal;
