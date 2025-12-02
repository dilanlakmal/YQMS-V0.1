import { useState, useEffect } from "react";
import Joyride from "react-joyride";

export default function ChatGuide({steps}) {
  const [startGuide, setStartGuide] = useState(false);


  useEffect( () => {
    // const hasSeenGuide = localStorage.getItem("hasSeenGuide");
    const hasSeenGuide = false;

    if (!hasSeenGuide) {
        setStartGuide(true);
        localStorage.setItem("hasSeenGuide", "false");
    }
  }, [startGuide]);

  return (
    <Joyride
      steps={steps}
      run={startGuide}
      continuous
      showSkipButton
      scrollToFirstStep
      styles={{
        options: {
          zIndex: 1000,
        },
      }}
    />
  );
}
