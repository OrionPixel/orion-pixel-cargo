import React from 'react';

// Force styling component to bypass cache issues
export const BookingModalStyles = () => {
  React.useEffect(() => {
    console.log('🎨 BookingModalStyles: Starting DOM injection...');
    
    // Create and inject styles directly into DOM
    const styleId = 'booking-modal-force-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      console.log('🎨 BookingModalStyles: Removing existing styles');
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* FORCE PURPLE STYLING v${Date.now()} */
      .booking-modal-input {
        border: 4px solid #8427d7 !important;
        border-radius: 10px !important;
        padding: 16px 18px !important;
        background: #ffffff !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        color: #2d3748 !important;
        width: 100% !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 8px rgba(132, 39, 215, 0.2) !important;
      }
      
      .booking-modal-input:focus {
        border-color: #8427d7 !important;
        box-shadow: 0 0 0 4px rgba(132, 39, 215, 0.15) !important;
        outline: none !important;
        background: #fafafa !important;
      }
      
      .booking-modal-input:hover {
        border-color: #6b21a8 !important;
        background: #f8f9fa !important;
      }
      
      /* Force all input elements inside BookingModal */
      .booking-modal-container input[type="text"],
      .booking-modal-container input[type="email"],
      .booking-modal-container input[type="tel"],
      .booking-modal-container input[type="number"],
      .booking-modal-container input[type="datetime-local"],
      .booking-modal-container textarea,
      .booking-modal-container select {
        border: 3px solid #8427d7 !important;
        border-radius: 8px !important;
        padding: 14px 16px !important;
        background: #ffffff !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        color: #2d3748 !important;
      }
      
      .booking-modal-container input:focus,
      .booking-modal-container textarea:focus,
      .booking-modal-container select:focus {
        border-color: #8427d7 !important;
        box-shadow: 0 0 0 4px rgba(132, 39, 215, 0.15) !important;
        outline: none !important;
        background: #fafafa !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 BookingModalStyles: Purple styles injected successfully!');
    
    // Force re-apply styles to existing elements
    setTimeout(() => {
      const allInputs = document.querySelectorAll('.booking-modal-container input, .booking-modal-container textarea, .booking-modal-container select');
      console.log(`🎨 BookingModalStyles: Found ${allInputs.length} input elements to style`);
      
      allInputs.forEach((input, index) => {
        const element = input as HTMLElement;
        element.style.border = '4px solid #8427d7';
        element.style.borderRadius = '10px';
        element.style.padding = '16px 18px';
        element.style.background = '#ffffff';
        element.style.fontSize = '16px';
        element.style.fontWeight = '600';
        console.log(`🎨 Applied purple styling to input ${index + 1}`);
      });
    }, 100);
    
    return () => {
      const cleanupStyle = document.getElementById(styleId);
      if (cleanupStyle) {
        cleanupStyle.remove();
        console.log('🎨 BookingModalStyles: Cleanup complete');
      }
    };
  }, []);

  return null;
};