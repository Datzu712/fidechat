import type { ReactNode } from 'react';

interface LoadingScreenProps {
    readonly displayLoadingScreen: boolean;
    readonly children?: ReactNode;
}

function LoadingScreen({ displayLoadingScreen, children }: LoadingScreenProps) {
    if (!displayLoadingScreen) {
        return <>{children}</>;
    }

    return (
        <div
            id="loading-screen"
            className={`${displayLoadingScreen} position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center`}
            style={{ zIndex: 1055 }}
        >
            <div className="text-center">
                <output className="spinner-border text-primary">
                    <span
                        id="loading-screen-message"
                        className="visually-hidden"
                    >
                        Cargando...
                    </span>
                </output>
                <p className="mt-2">Cargando...</p>
            </div>
        </div>
    );
}

export default LoadingScreen;
