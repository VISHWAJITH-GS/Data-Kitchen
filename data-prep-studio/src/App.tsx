import React, { useState } from 'react';
import Studio from './Studio';
import { LandingPage } from './components/LandingPage';

function App() {
  const [route, setRoute] = useState<'landing' | 'studio'>('landing');

  return (
    <>
      {route === 'landing' && <LandingPage onStart={() => setRoute('studio')} />}
      {route === 'studio' && <Studio />}
    </>
  );
}

export default App;
