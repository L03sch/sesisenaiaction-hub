import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import Index from '@/pages/Index';

export const IndexWithSplash = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <Index />;
};
