import { useRef } from 'react';
import { Modal } from './Modal';
import { exportAllData, importData } from '../utils/exportData';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Tuonti korvaa nykyiset tiedot. Jatketaanko?')) {
      e.target.value = '';
      return;
    }
    importData(file).catch((err) => {
      alert(`Tuonti epäonnistui: ${err instanceof Error ? err.message : err}`);
    });
  };

  return (
    <Modal onClose={onClose} className="settings-modal">
      <h2>Asetukset</h2>

      <section className="settings-section">
        <h3 className="settings-section-title">Tietojen varmuuskopiointi</h3>
        <p className="settings-description">
          Vie pelitiedot JSON-tiedostona tai tuo aiemmin viety varmuuskopio.
        </p>
        <div className="settings-actions">
          <button className="settings-btn" onClick={() => exportAllData()}>
            Vie tiedot
          </button>
          <button
            className="settings-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Tuo tiedot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </section>
    </Modal>
  );
}
