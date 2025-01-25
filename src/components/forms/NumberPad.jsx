import { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import the X icon

function NumberPad({ onClose, onInput }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg relative">
        {/* Close button (X icon) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        <div className="mb-4">
          <input
            type="text"
            value={inputValue}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right text-2xl"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
            <button
              key={number}
              onClick={() => handleNumberClick(number.toString())}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {number}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            ←
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inputValue} // Disable submit button if input is empty
            className={`col-span-2 px-4 py-2 ${
              inputValue
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-300 cursor-not-allowed"
            } text-white rounded-md`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default NumberPad;
