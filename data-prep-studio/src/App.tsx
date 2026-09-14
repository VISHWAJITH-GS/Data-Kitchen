import React, { useState } from 'react';
import WizardStudio from './components/WizardStudio';
import { LandingPage } from './components/LandingPage';

function App() {
  const [route, setRoute] = useState<'landing' | 'studio'>('landing');

  return (
    <>
      {route === 'landing' && <LandingPage onStart={() => setRoute('studio')} />}
      {route === 'studio' && <WizardStudio />}
    </>
  );
}

export default App;
