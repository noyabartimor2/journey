// Home: nothing but the word JOURNEY and one line, on the living aura.
import { SUBTITLE } from '../data/days.js';
import { AuraStage, JourneyWord } from '../components/Aura.jsx';

export function Home() {
  return (
    <AuraStage className="home">
      <main className="home-hero">
        <JourneyWord />
        <p className="home-line">{SUBTITLE}</p>
      </main>
    </AuraStage>
  );
}
