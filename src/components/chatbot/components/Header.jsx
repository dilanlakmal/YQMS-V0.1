import { Button } from "../ui/Button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MarqueeText } from "./Input";

export default function BotHeader({ onClose }) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/home");
    onClose?.();
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-semibold animate-pulse">
            AI
          </span>
        </div>
        <h1
          className="text-lg font-semibold cursor-pointer hover:underline animate-pulse"
          onClick={() => navigate("/")}
        >
          YQMS
        </h1>
      </div>

      {/* Center: Marquee */}
      <div className="bg-gray-500 text-white flex-1 mx-4 overflow-hidden whitespace-nowrap max-w-screen-xl">
        <MarqueeText
          text="Our AI is currently under active development and is gradually gaining more advanced capabilities. It now supports document translation through Azure, allowing you to seamlessly translate content across multiple languages. You can also select from different AI models to generate text or insights tailored to your needs. Additionally, Rasa Pro has been integrated to intelligently handle QC-related questions, providing logical and accurate responses. More features and improvements will be added over time as we continue to enhance the system."
          speed={40} // 60*3
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
