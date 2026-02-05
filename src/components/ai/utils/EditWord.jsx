import { useState, useEffect, useRef } from "react";

const EditWord = ({ word, onChange }) => {
  const [value, setValue] = useState(word || "");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(word || "");
  }, [word]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleFinish = () => {
    setEditing(false);
    if (value !== word) {
      onChange?.(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  if (editing) {
    return (
      <span className="inline-grid items-center align-middle relative">
        {/* Ghost element to determine width */}
        <span className="col-start-1 row-start-1 invisible whitespace-pre px-1 font-[inherit] text-[inherit] border border-transparent pointer-events-none opacity-0 h-0 sm:h-auto">
          {value || " "}
        </span>

        <input
          ref={inputRef}
          className="col-start-1 row-start-1 w-full h-full bg-transparent outline-none px-1 border-b-2 border-indigo-500 text-inherit font-[inherit] p-0 m-0 min-w-[2rem]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleFinish}
          onKeyDown={handleKeyDown}
          style={{ font: 'inherit', letterSpacing: 'inherit', textAlign: 'inherit' }}
        />
      </span>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="inline-block align-middle p-1 hover:bg-black/5 rounded cursor-text transition-colors min-w-[1em] min-h-[1.2em]"
      title="Click to edit"
    >
      {value}
    </span>
  );
};

export default EditWord;