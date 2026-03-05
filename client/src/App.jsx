import { useGame } from './context/GameContext';
import HomeView from './views/HomeView';
import HostView from './views/HostView';
import PlayerView from './views/PlayerView';
import WaitingRoom from './components/WaitingRoom/WaitingRoom';
import Victory from './components/Victory/Victory';

export default function App() {
  const { view, isHost } = useGame();

  if (view === 'home') return <HomeView />;
  if (view === 'waiting') return <WaitingRoom />;
  if (view === 'playing') return isHost ? <HostView /> : <PlayerView />;
  if (view === 'victory') return <Victory />;
  return <HomeView />;
}
