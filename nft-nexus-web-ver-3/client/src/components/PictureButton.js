import React from 'react';
import { useNavigate } from 'react-router-dom';

const PictureButton = ({ src, alt, to, width, height }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <img
      src={src}
      alt={alt}
      style={{ cursor: 'pointer', width: width, height: height }}
      onClick={handleClick}
    />
  );
};

export default PictureButton;