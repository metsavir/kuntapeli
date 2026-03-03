import { Modal } from './Modal';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Modal onClose={onClose}>
      <h2>Miten pelataan?</h2>
      <p>Arvaa päivän suomalainen kunta kuudella yrityksellä.</p>
      <p>Jokaisen arvauksen jälkeen näet:</p>
      <ul>
        <li>
          <strong>Etäisyys</strong> — kuinka kaukana arvauksesi on oikeasta
          kunnasta
        </li>
        <li>
          <strong>Suunta</strong> — nuoli osoittaa oikean kunnan suuntaan
        </li>
        <li>
          <strong>Läheisyys</strong> — prosenttiluku kertoo kuinka lähellä olet
        </li>
      </ul>
      <div className="help-example">
        <div className="help-example-row">
          <span>Tampere</span>
          <span>150 km</span>
          <span>↗️</span>
          <span>86%</span>
        </div>
      </div>
      <p className="help-hint">Uusi peli joka päivä keskiyöllä!</p>
    </Modal>
  );
}
