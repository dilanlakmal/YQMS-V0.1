import { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import the X icon
import { useTranslation } from "react-i18next";

function NumberPad({ onClose, onInput }) {
  const {t} = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const handleNumberClick = (number) => {
   const newValue = inputValue + number;
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl p-8 shadow-lg animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-medium">{t("numPad.enter_number")}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={inputValue}
            readOnly
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-right text-2xl font-medium"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
            <button
              key={number}
              onClick={() => handleNumberClick(number.toString())}
              className="py-6 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 text-2xl font-medium"
            >
              {number}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="py-6 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 active:bg-red-300 text-2xl font-medium"
          >
            ←
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inputValue}
            className={`col-span-2 py-6 text-white rounded-xl text-2xl font-medium ${
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
