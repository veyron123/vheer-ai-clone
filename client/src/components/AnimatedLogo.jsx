import React, { useState, useEffect, useCallback } from 'react';
import '../styles/animated-logo.css';

const AnimatedLogo = ({ 
  className = "w-10 h-10", 
  alt = "ColibRRRi Logo",
  triggerAnimation = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      // Delayed entrance for more dramatic effect
      const visibilityTimer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      const loadTimer = setTimeout(() => {
        setHasLoaded(true);
      }, 200);
      
      return () => {
        clearTimeout(visibilityTimer);
        clearTimeout(loadTimer);
      };
    } else {
      setIsVisible(true);
      setHasLoaded(true);
    }
  }, [triggerAnimation]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div 
      className={`animated-logo-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
    >
      <img 
        src="/colibrrri-logo.png" 
        alt={alt}
        className={`
          animated-logo 
          ${hasLoaded ? 'loaded' : ''} 
          ${isHovered ? 'hovered' : ''}
          ${triggerAnimation && !hasLoaded ? 'initial-animation' : ''}
        `.trim()}
        loading="eager"
        draggable={false}
      />
      
    </div>
  );
};

export default AnimatedLogo;