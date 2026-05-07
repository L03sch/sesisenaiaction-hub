import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  logo?: string;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  logo = '/pngsenaindustrial.png',
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for fade animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onComplete, 1000); // Wait for fade animation to complete
  };

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 bg-slate-900 flex items-center justify-center cursor-pointer transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="img"
      aria-label="SENAI Splash Screen"
    >
      <img
        src={logo}
        alt="SENAI Logo"
        className="w-40 h-40 object-contain"
      />
    </div>
  );
};
