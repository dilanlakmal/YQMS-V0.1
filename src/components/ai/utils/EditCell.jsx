import { useState, useEffect } from "react";
import { diffArrays } from "diff";
import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();

function getGraphemeDiff(oldText, newText) {
    const oldArr = splitter.splitGraphemes(oldText);
    const newArr = splitter.splitGraphemes(newText);

    return diffArrays(oldArr, newArr);
}


const EditCell = ({
    value,
    className,
    originValue,
    as: Tag = "td",
    colSpan = 1,
    type = null,
    allow = true,
    setGlossary,
    glossary
}) => {

    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    const handleSave = () => {
        const diffs = getGraphemeDiff(originValue, inputValue);
        console.log("Diffs:", diffs);

        let removed = "";
        let added = "";

        diffs.forEach(part => {
            if (part.added) added += part.value.join("");
            if (part.removed) removed += part.value.join("");
        });

        diffs.forEach(part => {
            if (part.added) added += part.value;
            if (part.removed) removed += part.value;
        });

        // Store diff result
        setGlossary(prev => ({
            ...prev,
            [removed.trim()]: added.trim()
        }));
    };

    const handleBlur = () => {
        setEditing(false);
        handleSave();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.target.blur();   // triggers handleBlur()
        }
    };

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    return (
        <Tag
            colSpan={colSpan}
            className={className}
            onClick={() => allow && setEditing(true)}
        >
            {editing ? (
                <input
                    type={type}
                    className="w-full h-full p-2 box-border"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    autoFocus
                />
            ) : (
                type === "image"
                    ? <img alt={type} />
                    : <span>{inputValue}</span>
            )}
        </Tag>
    );
};






export default EditCell;