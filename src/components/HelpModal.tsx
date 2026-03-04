import { Modal } from './Modal';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Modal onClose={onClose}>
      <h2>Miten pelataan?</h2>
      <p>
        Tunnista suomalainen kunta rajat- tai vaakunakuvasta. Sinulla on{' '}
        <strong>6 arvausta</strong>.
      </p>
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
      <p>
        Voit pyytää enintään <strong>3 vihjettä</strong>: maakunta, väkiluku ja
        naapurikunnat. Voit myös luovuttaa.
      </p>
      <h3>Pelitilat</h3>
      <ul>
        <li>
          <strong>Päivittäinen</strong> — sama kunta kaikille, vaihtuu
          keskiyöllä
        </li>
        <li>
          <strong>Harjoittelu</strong> — pelaa rajattomasti
        </li>
        <li>
          <strong>Ura</strong> — arvaa kaikki 308 kuntaa
        </li>
      </ul>
    </Modal>
  );
}
