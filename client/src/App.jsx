import { useGame } from './context/GameContext';
import HomeView from './views/HomeView';
import HostView from './views/HostView';
import PlayerView from './views/PlayerView';
import WaitingRoom from './components/WaitingRoom/WaitingRoom';
import Victory from './components/Victory/Victory';

function ConnectionBanner({ status }) {
  if (status === 'connected') return null;
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 text-center py-2 text-sm font-bold
      ${status === 'connecting' 
        ? 'bg-yellow-500 text-black' 
        : 'bg-red-600 text-white'}`}>
      {status === 'connecting' ? 'Reconectando...' : 'Sin conexión al servidor'}
    </div>
  );
}

export default function App() {
  const { view, isHost, connectionStatus } = useGame();

  return (
    <>
      <ConnectionBanner status={connectionStatus} />
      {view === 'home' && <HomeView />}
      {view === 'waiting' && <WaitingRoom />}
      {view === 'playing' && (isHost ? <HostView /> : <PlayerView />)}
      {view === 'victory' && <Victory />}
    </>
  );
}
