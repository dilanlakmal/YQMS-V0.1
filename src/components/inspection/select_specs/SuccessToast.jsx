import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * A toast notification styled to match the Buyer Specs management pages.
 * It supports dark mode and uses the same color palette.
 */
const SuccessToast = ({ isOpen, message, onClose, duration = 3000 }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    let closeTimer;
    let visibilityTimer;

    if (isOpen) {
      // Start the showing animation
      setIsShowing(true);

      // Set a timer to start the hiding animation
      closeTimer = setTimeout(() => {
        setIsShowing(false);
        // Set another timer to call the onClose prop after the animation completes
        visibilityTimer = setTimeout(onClose, 400); // Must match transition duration
      }, duration);
    } else {
      setIsShowing(false);
    }

    // Cleanup timers on component unmount or if isOpen changes
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(visibilityTimer);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed top-5 right-5 z-50 transition-all duration-300 ease-in-out transform ${
        isShowing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
      }`}
    >
      <div
        className="flex items-center gap-4 bg-green-100 dark:bg-green-900/60 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 py-3 px-5 rounded-lg shadow-lg"
        role="alert"
      >
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

export default SuccessToast;
