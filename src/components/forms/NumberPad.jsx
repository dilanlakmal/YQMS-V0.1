import { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import the X icon
import { useTranslation } from "react-i18next";

function NumberPad({ onClose, onInput }) {
  const {t} = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const handleNumberClick = (number) => {
    setInputValue((prev) => prev + number);
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    onInput(inputValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl p-4 shadow-lg animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("numPad.enter_number")}</h3>
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
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
            <button
              key={number}
              onClick={() => handleNumberClick(number.toString())}
              className="py-4 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 text-xl"
            >
              {number}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="py-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 active:bg-red-300 text-xl"
          >
            ←
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inputValue}
            className={`col-span-2 py-4 text-white rounded-lg text-xl ${
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
  );
}

export default NumberPad;
