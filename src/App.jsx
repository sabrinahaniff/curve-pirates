import { useState } from 'react';
import { TopNav } from './components/UI';
import Level1 from './levels/Level1';
import Level2 from './levels/Level2';
import Level3 from './levels/Level3';
import Level4 from './levels/Level4';
import Level5 from './levels/Level5';
import Level6 from './levels/Level6';

const LEVELS = { 1: Level1, 2: Level2, 3: Level3, 4: Level4, 5: Level5, 6: Level6 };

export default function App() {
  const [level, setLevel] = useState(1);
  const Level = LEVELS[level];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav currentLevel={level} onNavigate={setLevel} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Level />
      </div>
    </div>
  );
}
