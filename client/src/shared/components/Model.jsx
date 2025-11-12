import React, { useEffect } from 'react';
import '../styles/Model.css'; // Ensure this path is correct

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e) => {
    // Only close if the overlay itself (not content) is clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    // Add escape key listener
    document.addEventListener('keydown', handleEscape);
    // Cleanup listener
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]); // Add onClose to dependencies

  return (
    // The overlay div handles background dimming and click-outside-to-close
    <div className="modal-overlay" onClick={handleBackdropClick}>
      {/* The container is now mostly transparent and sized by its content */}
      <div className="modal-container">
        {/* REMOVED: The <button className="modal-close"...> used to be here */}
        {/* The body div just passes children through */}
        <div className="modal-body">
          {children} {/* This will render your <div className="email-detail-modal">...</div> */}
        </div>
      </div>
    </div>
  );
};

export default Modal;
