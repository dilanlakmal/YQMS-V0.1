import { use } from "react";
import { useState, useEffect } from "react";

const EditWord = ({ word, onChange }) => {
  const [value, setValue] = useState(word);
  const [editing, setEditing] = useState(false);

    useEffect(() => {
        setValue(word);
    }, [word]);
  return (
    <span className="inline-block align-middle">
      {editing ? (
        <input
          className="inline-block w-full"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onBlur={() => setEditing(false)}
          autoFocus
        />
      ) : (
        <span onClick={() => setEditing(true)}>{value}</span>
      )}
    </span>
  );
};
export default EditWord;