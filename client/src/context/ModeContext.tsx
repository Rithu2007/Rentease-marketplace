import React, { createContext, useContext, useState } from 'react';

type Mode = 'buy' | 'rent';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem('rentease_mode');
    return (saved as Mode) || 'buy';
  });

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('rentease_mode', newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'buy' ? 'rent' : 'buy');
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};
