import React, { useState, useRef } from "react";
import LanguageSelector from "./LanguageSelector";
import { API_BASE_URL } from "../../../config";

const VALID_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function FileTranslator() {
  const [files, setFiles] = useState([])
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef(null)

  const validateFiles = (filesToValidate) => {
    for (const file of filesToValidate) {
      if (!VALID_FILE_TYPES.includes(file.type)) {
        return `Invalid file type: ${file.name}. Supported: PDF, DOC, DOCX, JPG, PNG`
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File too large: ${file.name}. Maximum size: 50MB`
      }
    }
    return null
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError("")

    const newFiles = Array.from(e.dataTransfer.files)
    const validationError = validateFiles(newFiles)

    if (validationError) {
      setError(validationError)
      return
    }

    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileSelect = (e) => {
    setError("")
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validationError = validateFiles(newFiles)

      if (validationError) {
        setError(validationError)
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
    }
    e.target.value = ""
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTranslate = async () => {
    if (files.length === 0) {
      setError("Please select at least one file")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      formData.append("targetLanguage", targetLanguage)

      const response = await fetch("/api/translate-files", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url

        const contentDisposition = response.headers.get("content-disposition")
        const fileName = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : "translated-files.zip"

        link.download = fileName || "translated-files.zip"
        link.click()
        window.URL.revokeObjectURL(url)

        setSuccess(`${files.length} file(s) translated successfully!`)
        setFiles([])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Translation failed. Please try again.")
      }
    } catch (err) {
      setError("Error connecting to translation service")
      console.error("File translation error:", err)
    } finally {
      setIsLoading(false)
    }
  };

  const handleClear = () => {
    setFiles([])
    setError("")
    setSuccess("")
  }

  const totalFileSize = files.reduce((sum, file) => sum + file.size, 0)
  const totalFileSizeMB = (totalFileSize / (1024 * 1024)).toFixed(2)

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Target Language */}
      <div className="space-y-4">
        <label className="text-sm font-semibold translator-text-foreground">Target Language</label>
        <LanguageSelector value={targetLanguage} onChange={setTargetLanguage} label="Translate to:" />
      </div>

      <div className="space-y-3">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`translator-rounded border-2 border-dashed p-12 text-center transition-all ${
            dragActive
              ? "translator-primary translator-text-foreground shadow-md"
              : "translator-card translator-border hover:translator-primary-text"
          }`}
        >
          <svg
            className="mx-auto mb-4 h-12 w-12 translator-primary-text opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 translator-text-foreground font-medium">Drag and drop your files here</p>
          <p className="mb-4 text-sm translator-muted-foreground">or use the buttons below</p>
          <p className="mb-4 text-xs translator-muted-foreground">Supported: PDF, DOC, DOCX, JPG, PNG • Max 50MB per file</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAttachmentClick}
            className="w-full translator-rounded translator-primary px-4 py-2.5 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            Attach Files
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="translator-rounded translator-border translator-destructive-bg-light p-4 text-sm translator-destructive flex items-start gap-3">
          <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="translator-rounded translator-border p-4 text-sm flex items-start gap-3" style={{ backgroundColor: "oklch(0.9 0.05 150 / 0.15)" }}>
          <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold translator-text-foreground">
              Selected Files ({files.length}) • {totalFileSizeMB} MB
            </h3>
            {files.length > 0 && (
              <button onClick={handleClear} className="text-xs font-medium translator-muted-foreground hover:translator-text-foreground">
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between translator-rounded translator-card translator-border p-3 hover:translator-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {file.type === "application/pdf" && (
                      <span className="inline-flex items-center justify-center w-8 h-8 translator-rounded" style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: 12 }}>
                        PDF
                      </span>
                    )}
                    {file.type.includes("word") && (
                      <span className="inline-flex items-center justify-center w-8 h-8 translator-rounded" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", fontWeight: 700, fontSize: 12 }}>
                        DOC
                      </span>
                    )}
                    {file.type.includes("image") && (
                      <span className="inline-flex items-center justify-center w-8 h-8 translator-rounded" style={{ backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 12 }}>
                        IMG
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm translator-text-foreground truncate">{file.name}</p>
                    <p className="text-xs translator-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-2 text-xs font-medium translator-destructive translator-rounded px-2 py-1 hover:translator-destructive-bg-light transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={files.length === 0 || isLoading}
        className="w-full translator-rounded translator-primary px-6 py-3 font-semibold transition-all opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            Translating Files...
          </span>
        ) : (
          `Translate ${files.length > 0 ? files.length : ""} File${files.length !== 1 ? "s" : ""}`
        )}
      </button>
    </div>
  )
}

