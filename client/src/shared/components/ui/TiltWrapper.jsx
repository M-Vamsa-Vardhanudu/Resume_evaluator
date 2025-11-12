import React, { useRef, useEffect } from 'react';
import './TiltWrapper.css'; // This is the line that imports your CSS

/**
 * A wrapper component that applies a 3D tilt effect
 * to any children passed to it.
 */
const TiltWrapper = ({
  children,
  rotateAmplitude = 15,
  scaleHover = 1.05,
}) => {
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const inner = innerRef.current;
    if (!card || !inner) return;

    // Mouse Move Handler
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;
      const rotationX = (-offsetY / (rect.height / 2)) * rotateAmplitude;
      const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;
      inner.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scaleHover})`;
    };

    // Mouse Enter Handler
    const handleMouseEnter = () => {
      inner.style.transition = 'transform 0.1s ease-out';
    };

    // Mouse Leave Handler
    const handleMouseLeave = () => {
      inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      inner.style.transition = 'transform 0.4s ease';
    };

    // Add all event listeners
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [rotateAmplitude, scaleHover]);

  return (
    <div className="tilt-wrapper" ref={cardRef}>
      <div className="tilt-wrapper-inner" ref={innerRef}>
        {children} {/* This renders the StatCard inside */}
      </div>
    </div>
  );
};

export default TiltWrapper;
