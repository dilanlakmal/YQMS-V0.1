import { FaTimes, FaCog } from "react-icons/fa";
import { Button } from "@/components/Chatbot/ui/button";
import { Send, Plus, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BotHeader({ onClose }) {
  const navigate = useNavigate();
  const handleClose = () => {
    navigate("/home");
    onClose();
  };
  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-semibold">
            AI
          </span>
        </div>
        <h1 className="text-lg font-semibold" onClick={() => navigate("/")}>
          YQMS AI
        </h1>
      </div>
      <div className="ml-auto flex gap-2">
        {/* <Button variant="ghost" size="icon">
          <Plus className="h-5 w-5" />
        </Button> */}
        {onClose && (
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
