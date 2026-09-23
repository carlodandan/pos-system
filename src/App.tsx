import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import PosApp from './components/PosApp';

function App() {
  return (
    <ThemeProvider>
      <PosApp />
    </ThemeProvider>
  );
}

export default App;