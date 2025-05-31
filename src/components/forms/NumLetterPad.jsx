import { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import the X icon
import { useTranslation } from "react-i18next";

function NumLetterPad({ onClose, onInput }) {
  const {t} = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const handleInputClick = (value) => {
    const newValue = inputValue + value;
    setInputValue(newValue);
    onInput(newValue);
  };

  const handleBackspace = () => {
    const newValue = inputValue.slice(0, -1);
    setInputValue(newValue);
    onInput(newValue);
  };

  const handleSubmit = () => {
   if (inputValue === "") {
        onInput("");
    }
    // Don't close the keypad when Enter is pressed
  };
  
  const handleDone = () => {
    if (inputValue === "") {
        onInput("");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl p-4 shadow-lg animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("numPad.enter_details")}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={inputValue}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-right text-2xl font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue) {
                handleSubmit();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          {/* Letters */}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 26 }, (_, i) =>
              String.fromCharCode(65 + i)
            ).map((letter) => (
              <button
                key={letter}
                onClick={() => handleInputClick(letter)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 text-sm"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i.toString()).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => handleInputClick(number)}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 text-sm"
                >
                  {number}
                </button>
              )
            )}
          </div>

          {/* Symbols and Controls */}
          <div className="grid grid-cols-10 gap-1">
            {["/", "\\", "-"].map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleInputClick(symbol)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 text-sm"
              >
                {symbol}
              </button>
            ))}
            <button
              onClick={() => handleInputClick(" ")}
              className="col-span-2 p-2 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 text-sm"
            >
              Space
            </button>
            <button
              onClick={handleSubmit}
              disabled={!inputValue}
              className={`col-span-2 p-2 rounded text-sm ${
                inputValue
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              Enter
            </button>
            <button
              onClick={handleBackspace}
              className="col-span-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 active:bg-red-300 text-sm"
            >
              ← {t("set.delete")}
            </button>
            <button
              onClick={handleDone}
              disabled={!inputValue}
              className={`col-span-2 p-2 text-white rounded text-sm ${
                inputValue
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {t("numPad.done")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumLetterPad;
