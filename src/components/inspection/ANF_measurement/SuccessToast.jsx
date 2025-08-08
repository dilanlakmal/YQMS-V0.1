import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

const SuccessToast = ({ isOpen, message, onClose, duration = 2000 }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    let closeTimer;
    let visibilityTimer;

    if (isOpen) {
      setIsShowing(true);

      closeTimer = setTimeout(() => {
        setIsShowing(false);
        visibilityTimer = setTimeout(onClose, 400); // Match transition duration
      }, duration);
    } else {
      setIsShowing(false);
    }

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(visibilityTimer);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) {
    return null;
  }

  // --- FIX IS HERE: Only ONE root element is returned ---
  return (
    // This is the SINGLE root element. It controls the position and animation.
    <div
      className={`fixed top-5 right-5 z-50 transition-all duration-300 ease-in-out transform ${
        isShowing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
      }`}
    >
      {/* This inner div is for styling the toast content itself. */}
      <div className="flex items-center gap-3 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-2xl">
        <CheckCircle2 size={24} />
        <p>{message}</p>
      </div>
    </div>
  );
};

export default SuccessToast;
