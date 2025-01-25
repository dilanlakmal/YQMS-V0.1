import { useState } from "react";

function NumLetterPad({ onClose, onInput }) {
  const [inputValue, setInputValue] = useState("");

  const handleInputClick = (value) => {
    setInputValue((prev) => prev + value);
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    onInput(inputValue);
    onClose();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <div className="mb-4">
        <input
          type="text"
          value={inputValue}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-right text-2xl"
        />
      </div>

      {/* English Letters (3x10 Grid) */}
      <div className="grid grid-cols-10 gap-2 mb-4">
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(
          (letter) => (
            <button
              key={letter}
              onClick={() => handleInputClick(letter)}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {letter}
            </button>
          )
        )}
      </div>

      {/* Numbers (1x10 Grid) */}
      <div className="grid grid-cols-10 gap-2 mb-4">
        {Array.from({ length: 10 }, (_, i) => i.toString()).map((number) => (
          <button
            key={number}
            onClick={() => handleInputClick(number)}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {number}
          </button>
        ))}
      </div>

      {/* Symbols (1x10 Grid) */}
      <div className="grid grid-cols-10 gap-2 mb-4">
        {["/", "\\", "-"].map((symbol) => (
          <button
            key={symbol}
            onClick={() => handleInputClick(symbol)}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {symbol}
          </button>
        ))}
        {/* Fill remaining columns with empty divs */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>

      {/* Controls (Delete and Submit in 1x10 Grid) */}
      <div className="grid grid-cols-10 gap-2">
        <button
          onClick={handleBackspace}
          className="col-span-5 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          ← Delete
        </button>
        <button
          onClick={handleSubmit}
          className="col-span-5 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default NumLetterPad;
