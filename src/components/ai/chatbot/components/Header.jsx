import { Button } from "../ui/Button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MarqueeText } from "../ui/MarqueeText";

export default function BotHeader({ onClose, language, setLanguage }) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/home");
    onClose?.();
  };

  return (
    <header className="flex items-center justify-between border-b-2 border-gray-200 bg-gradient-to-r from-white via-blue-50 to-purple-50 px-6 py-4 shadow-md">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-blue-200 transition-transform hover:scale-110">
          <span className="text-white text-sm font-bold">
            AI
          </span>
        </div>
        <div className="flex flex-col">
          <h1
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all"
            onClick={() => navigate("/")}
          >
            YQMS
          </h1>
          <span className="text-[10px] text-gray-500 font-medium">AI Assistant</span>
        </div>
      </div>

      {/* Center: Marquee */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white flex-1 mx-6 overflow-hidden whitespace-nowrap max-w-screen-xl rounded-lg px-3 py-2 shadow-md">
        <MarqueeText
          text="🚀 Our AI is under active development with advanced capabilities • Document translation via Azure • Multiple AI models • Rasa Pro for QC questions • More features coming soon!"
          speed={50}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="relative group">
          {/* Globe icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <select
            className="
            appearance-none
            bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50
            text-gray-800
            text-xs
            font-semibold
            pl-10 pr-10 py-2.5
            rounded-xl
            border-2
            border-blue-300
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
            shadow-md
            hover:shadow-lg
            hover:border-blue-400
            hover:from-blue-100
            hover:via-blue-200
            hover:to-blue-100
            transition-all
            duration-200
            font-medium
            cursor-pointer
            backdrop-blur-sm
          "
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en" className="bg-white text-gray-800 py-2">🇬🇧 English</option>
            <option value="km" className="bg-white text-gray-800 py-2">🇰🇭 Khmer</option>
            <option value="zh" className="bg-white text-gray-800 py-2">🇨🇳 Chinese</option>
            <option value="fr" className="bg-white text-gray-800 py-2">🇫🇷 French</option>
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-blue-700 group-hover:text-blue-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
            <div className="font-semibold mb-0.5">Response Language</div>
            <div className="text-gray-300">AI will respond in this language</div>
            {/* Arrow */}
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-red-50 hover:text-red-600 transition-all rounded-lg group relative"
          >
            <X className="h-5 w-5" />
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
              Close
              <div className="absolute top-full right-2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </Button>
        )}
      </div>
    </header>
  );
}
