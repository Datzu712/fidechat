import { useContext } from 'react';
import { GlobalContext } from '../contexts/GlobalContext';

function Header(): JSX.Element {
    const { selectedChannel } = useContext(GlobalContext);

    // const handleInvite = () => {
    //     // Lógica para invitar a personas
    //     alert('Invite functionality not implemented yet.');
    // };

    return (
        <div className="card-header bg-primary-subtle text-white text-center">
            <div className="d-flex justify-content-between align-items-center">
                <h1 className="flex-grow-1">Fidechat</h1>
            </div>
            {selectedChannel && (
                <h5 className="mt-2">{selectedChannel.description}</h5>
            )}
        </div>
    );
}

export default Header;
