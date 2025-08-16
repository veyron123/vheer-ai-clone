import React from 'react';
import '../styles/colorful-logo.css';

const ColorfulLogo = ({ className = "" }) => {
  const letterColors = [
    'text-red-600',    // С - красный
    'text-orange-500', // o - оранжевый  
    'text-yellow-500', // l - желтый
    'text-green-500',  // i - зеленый
    'text-blue-600',   // b - синий
    'text-purple-600', // R - фиолетовый
    'text-pink-500',   // R - розовый
    'text-indigo-600', // R - индиго
    'text-cyan-500'    // i - голубой
  ];

  const letters = ['С', 'o', 'l', 'i', 'b', 'R', 'R', 'R', 'i'];

  return (
    <span className={`font-bold ${className} colorful-logo`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`${letterColors[index]} colorful-logo-letter`}
        >
          {letter}
        </span>
      ))}
    </span>
  );
};

export default ColorfulLogo;