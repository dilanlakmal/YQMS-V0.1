import { useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import GPRTTemplate from "./templates/GPRT/GPRTTemplate";



/**
 * InsertPdf Component
 * Handles PDF file insertion and template preview for production instruction translation.
 *
 * Props:
 * - team: string - Selected team name (e.g., "GPRT0007C")
 * - files: Array - List of uploaded files
 * - setFiles: Function - Setter for files state
 * - show: boolean - Whether to show the template
 * - preview: string - Current preview mode ("Preview" or "Complete")
 * - setPreview: Function - Setter for preview state
 * - currentStep: number - Current step index
 * - setCurrentStep: Function - Setter for current step
 */
const InsertPdf = ({
    team,
    files,
    setFiles,
    preview,
    setPreview,
    currentStep,
    setCurrentStep
}) => {
    // Handle preview toggle and step progression
    const handlePreviewToggle = () => {
        if (preview === "Complete") {
            setCurrentStep(prev => prev + 1);
            setPreview("Preview");
        } else {
            setPreview("Complete");
        }
    };

    // Remove a file from the list
    const handleFileDelete = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        if (updatedFiles.length === 0) {
            setPreview("");
        }
    };

    // Add new files to the list
    const handleFileAdd = (event) => {
        const newFiles = Array.from(event.target.files).filter(file =>
            file.type === "application/pdf" // Ensure only PDFs
        );
        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            setPreview("Preview")
        }
        event.target.value = ""; // Reset input
    };

    return (
        <div className="w-full h-full">
            <div className="text-white flex gap-10 justify-between items-start h-full">
            {/* File Upload Panel */}
            <section className="bg-gray-100 w-1/2 h-full  flex flex-col items-center justify-start rounded-lg shadow-lg mr-5">
                <header className="flex items-center justify-center h-[5%] bg-slate-500 w-full">
                    <h1 className="text-white font-semibold">Document Insertion</h1>
                </header>

                <section className="flex flex-col items-center w-full h-screen overflow-hidden pb-5">
                    {/* File Upload Area */}
                    <div className="h-fit w-[90%] flex flex-col items-center justify-center mt-5  bg-gray-500 rounded-lg border-2 border-dashed border-gray-400 hover:border-blue-400 transition-colors p-10">
                        <FaFilePdf className="text-4xl text-white mb-2" />
                        <label
                            htmlFor="pdfInput"
                            className="cursor-pointer text-white text-center px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            aria-label="Upload PDF files"
                        >
                            Select PDF Files
                        </label>
                        <input
                            id="pdfInput"
                            type="file"
                            accept=".pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileAdd}
                            aria-describedby="file-upload-help"
                        />
                        <p id="file-upload-help" className="text-sm text-gray-300 mt-2">
                            Upload one or more PDF files for translation
                        </p>
                    </div>

                    {/* Uploaded Files List */}
                    {files.length > 0 && (
                        <div className="flex flex-col mt-10  w-[90%] h-[50%] bg-gray-600 rounded-lg p-4 overflow-y-auto pb-10">
                            <h2 className="text-white font-semibold mb-3">Uploaded Files</h2>
                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                        <span className="text-white truncate">📄 {file.name}</span>
                                        <button
                                            onClick={() => handleFileDelete(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            aria-label={`Delete ${file.name}`}
                                        >
                                            <RiDeleteBin5Line className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </section>

            {/* Template Preview Panel */}
            <aside className="w-1/2  h-full text-black bg-white   rounded-lg shadow-lg pb-10">
                <header className="flex items-center justify-between h-[5%] bg-slate-500 w-full rounded-t-lg truncate">
                    <h1 className="text-white font-semibold ml-10">Pre-define Template</h1>
                    {preview && (
                        <button
                            onClick={handlePreviewToggle}
                            className="mr-10 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                            aria-label={`Switch to ${preview === "Preview" ? "Complete" : "Preview"} mode`}
                        >
                            {preview}
                        </button>
                    )}
                </header>
                <section className="mt-5 h-full w-full overflow-y-hidden  pb-10">
                    {team === "GPRT0007C" ? (
                        <div className="overflow-y-auto w-full h-full">
                            <GPRTTemplate
                                editable={preview === "Preview"}
                                step={preview}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-gray-500">
                            <p>Select a supported team to view the template.</p>
                        </div>
                    )}  
                </section>
            </aside>
            </div>
        </div>
    );
};

export default InsertPdf;