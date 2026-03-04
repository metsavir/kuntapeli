import { useServiceWorker } from '../hooks/useServiceWorker';
import './UpdateBanner.css';

export function UpdateBanner() {
  const { needRefresh, updateServiceWorker } = useServiceWorker();

  if (!needRefresh) return null;

  return (
    <div className="update-banner">
      <span>Päivitys saatavilla</span>
      <button onClick={() => updateServiceWorker(true)}>Päivitä</button>
    </div>
  );
}
