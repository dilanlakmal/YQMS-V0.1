import React, { useState, useRef, useEffect } from "react";
import LanguageSelector from "./LanguageSelector";
import GlossarySelector from "./glossaries/GlossarySelector";
import { API_BASE_URL } from "../../../config";

const VALID_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/html",
  "application/xml",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function FileTranslator() {
  const [uploadedFiles, setUploadedFiles] = useState([]) // Files uploaded via file input
  const [selectedBlobFiles, setSelectedBlobFiles] = useState([]) // Files selected from blob storage
  const [targetLanguage, setTargetLanguage] = useState("km")
  const [sourceLanguage, setSourceLanguage] = useState("auto") // Change from "en" to "auto"
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [progress, setProgress] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [blobFiles, setBlobFiles] = useState({ source: [], target: [] })
  const [loadingFiles, setLoadingFiles] = useState(false)
  const fileInputRef = useRef(null)
  const [characterCount, setCharacterCount] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [countingCharacters, setCountingCharacters] = useState(false);
  const [selectedGlossary, setSelectedGlossary] = useState(null);

  // Load files from blob storage
  const loadBlobFiles = async () => {
    setLoadingFiles(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate-files/list?container=all`)
      const data = await response.json()
      setBlobFiles({
        source: data.source?.files || [],
        target: data.target?.files || []
      })
    } catch (err) {
      console.error("Failed to load files:", err)
      setError("Failed to load files from storage")
    } finally {
      setLoadingFiles(false)
    }
  }

  useEffect(() => {
    if (activeTab === "upload") {
      loadBlobFiles() // Load files when on upload tab to show available files
    } else if (activeTab === "files") {
      loadBlobFiles()
    }
  }, [activeTab])

  const deleteBlobFile = async (container, fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/translate-files/delete?container=${container}&fileName=${encodeURIComponent(fileName)}`,
        { method: "DELETE" }
      )
      
      if (!response.ok) {
        throw new Error("Delete failed")
      }

      setSuccess(`Deleted: ${fileName}`)
      setTimeout(() => setSuccess(""), 3000)
      loadBlobFiles() // Reload files
    } catch (err) {
      setError(`Failed to delete ${fileName}: ${err.message}`)
    }
  }

  const downloadBlobFile = async (container, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/translate-files/download?container=${container}&fileName=${encodeURIComponent(fileName)}`
      )
      
      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Extract clean name for download
      const file = blobFiles.source.find(f => f.originalName === fileName) || 
                   blobFiles.target.find(f => f.originalName === fileName)
      const downloadName = file?.cleanName || fileName
      
      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccess(`Downloaded: ${downloadName}`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(`Failed to download: ${err.message}`)
    }
  }

  const toggleBlobFileSelection = (file) => {
    setSelectedBlobFiles(prev => {
      const exists = prev.find(f => f.originalName === file.originalName && f.container === file.container)
      if (exists) {
        return prev.filter(f => !(f.originalName === file.originalName && f.container === file.container))
      } else {
        return [...prev, file]
      }
    })
  }

  const validateFiles = (filesToValidate) => {
    for (const file of filesToValidate) {
      if (!VALID_FILE_TYPES.includes(file.type)) {
        return `Invalid file type: ${file.name}. Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, HTML, XML`
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

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    countCharacters(updatedFiles); // Count characters
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

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      countCharacters(updatedFiles); // Count characters
    }
    e.target.value = ""
  }

  const removeUploadedFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    countCharacters(updatedFiles); // Re-count after removal
  }

  const countCharacters = async (files) => {
    if (files.length === 0) {
      setCharacterCount(null);
      setEstimatedCost(null);
      return;
    }

    setCountingCharacters(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`${API_BASE_URL}/api/translate-files/character-count`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setCharacterCount(data.total.characterCount);
        setEstimatedCost(data.total.estimatedCost);
      } else {
        console.warn("Failed to count characters:", data.error);
      }
    } catch (err) {
      console.error("Error counting characters:", err);
    } finally {
      setCountingCharacters(false);
    }
  };

  const handleTranslate = async () => {
    const totalFiles = uploadedFiles.length + selectedBlobFiles.length
    
    if (totalFiles === 0) {
      setError("Please select or upload at least one file")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")
    setProgress("Preparing files for translation...")

    try {
      const formData = new FormData()
      
      // Add uploaded files
      uploadedFiles.forEach((file) => formData.append("files", file))
      
      // Add selected blob files
      if (selectedBlobFiles.length > 0) {
        formData.append("blobFileNames", JSON.stringify(
          selectedBlobFiles.map(f => ({ 
            originalName: f.originalName, 
            container: f.container 
          }))
        ))
      }
      
      formData.append("targetLanguage", targetLanguage)
      // Only send sourceLanguage if it's not "auto"
      if (sourceLanguage && sourceLanguage !== "auto") {
        formData.append("sourceLanguage", sourceLanguage)
      }
      // If sourceLanguage is "auto" or null, don't send it - Azure will auto-detect
      
      // Add glossary if selected
      if (selectedGlossary) {
        formData.append("glossaryBlobName", selectedGlossary)
      }

      setProgress("Submitting translation job to Azure...")

      const response = await fetch(`${API_BASE_URL}/api/translate-files`, {
        method: "POST",
        body: formData,
      })

      let data = null
      try {
        data = await response.json()
      } catch (jsonError) {
        console.warn("Failed to parse translation response JSON:", jsonError)
      }

      if (response.ok && data?.success) {
        setProgress("Translation completed!")
        setSuccess(data.message || `Translation job submitted successfully! Check the "My Files" tab to download translated files.`)
        setUploadedFiles([])
        setSelectedBlobFiles([])
        
        setTimeout(() => {
          loadBlobFiles()
        }, 1000)
      } else {
        const errorMessage = data?.error || data?.details || "Translation failed. Please try again."
        setError(errorMessage)
      }
    } catch (err) {
      setError(err.message || "Error connecting to translation service.")
      console.error("File translation error:", err)
    } finally {
      setIsLoading(false)
      setProgress("")
    }
  };

  const handleClear = () => {
    setUploadedFiles([])
    setSelectedBlobFiles([])
    setError("")
    setSuccess("")
    setProgress("")
    setSelectedGlossary(null)
  }

  const totalFileSize = [...uploadedFiles, ...selectedBlobFiles].reduce((sum, file) => {
    return sum + (file.size || 0)
  }, 0)
  const totalFileSizeMB = (totalFileSize / (1024 * 1024)).toFixed(2)

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const icons = {
      pdf: { bg: "#fee2e2", color: "#b91c1c", text: "PDF" },
      doc: { bg: "#dbeafe", color: "#1d4ed8", text: "DOC" },
      docx: { bg: "#dbeafe", color: "#1d4ed8", text: "DOC" },
      xls: { bg: "#dcfce7", color: "#15803d", text: "XLS" },
      xlsx: { bg: "#dcfce7", color: "#15803d", text: "XLS" },
      ppt: { bg: "#fef3c7", color: "#d97706", text: "PPT" },
      pptx: { bg: "#fef3c7", color: "#d97706", text: "PPT" },
      txt: { bg: "#e0e7ff", color: "#4338ca", text: "TXT" },
      html: { bg: "#e0e7ff", color: "#4338ca", text: "HTML" },
      xml: { bg: "#e0e7ff", color: "#4338ca", text: "XML" }
    }
    return icons[ext] || { bg: "#f3f4f6", color: "#6b7280", text: "FILE" }
  }

  const isBlobFileSelected = (file) => {
    return selectedBlobFiles.some(f => 
      f.originalName === file.originalName && f.container === file.container
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b translator-border">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "upload"
              ? "translator-primary-text border-b-2 border-primary"
              : "translator-muted-foreground hover:translator-text-foreground"
          }`}
        >
          Upload & Translate
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "files"
              ? "translator-primary-text border-b-2 border-primary"
              : "translator-muted-foreground hover:translator-text-foreground"
          }`}
        >
          My Files
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <>
          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold translator-text-foreground">Source Language</label>
              <LanguageSelector 
                value={sourceLanguage} 
                onChange={(lang) => {
                  setSourceLanguage(lang);
                  setSelectedGlossary(null); // Reset glossary when source language changes
                }}
                includeAuto={true}  // Add this prop to enable auto-detect option
                label=""  // Optional: hide label since it's already shown above
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold translator-text-foreground">Target Language</label>
              <LanguageSelector 
                value={targetLanguage} 
                onChange={(lang) => {
                  setTargetLanguage(lang);
                  setSelectedGlossary(null); // Reset glossary when target language changes
                }}
                label="To:" 
              />
            </div>
          </div>

          {/* Glossary Selection */}
          <div className="space-y-2">
            <GlossarySelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              value={selectedGlossary}
              onChange={setSelectedGlossary}
            />
          </div>

          {/* Available Files from Blob Storage */}
          {blobFiles.source.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold translator-text-foreground">
                Available Files in Storage (Select to translate)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto translator-rounded translator-border p-3">
                {blobFiles.source.map((file, idx) => {
                  const icon = getFileIcon(file.cleanName)
                  const isSelected = isBlobFileSelected({ ...file, container: "inputdocuments" })
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 translator-rounded cursor-pointer transition-colors ${
                        isSelected ? "translator-primary-bg-light ring-2 ring-primary" : "hover:translator-muted"
                      }`}
                      onClick={() => toggleBlobFileSelection({ ...file, container: "inputdocuments" })}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="inline-flex items-center justify-center w-8 h-8 translator-rounded font-bold text-xs" style={{ backgroundColor: icon.bg, color: icon.color }}>
                          {icon.text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm translator-text-foreground truncate font-medium">{file.cleanName}</p>
                          <p className="text-xs translator-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold translator-text-foreground">Or Upload New Files</h3>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`translator-rounded border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? "translator-primary translator-text-foreground shadow-md border-solid"
                  : "translator-card translator-border hover:translator-primary-text hover:border-primary"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={!isLoading ? handleAttachmentClick : undefined}
            >
              <svg
                className={`mx-auto mb-4 h-12 w-12 translator-primary-text opacity-80 ${dragActive ? "scale-110" : ""} transition-transform`}
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
              <p className="mb-4 text-sm translator-muted-foreground">or click to browse files</p>
              <p className="mb-4 text-xs translator-muted-foreground">
                Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, HTML, XML • Max 50MB per file
              </p>
            </div>

            <button
              onClick={handleAttachmentClick}
              disabled={isLoading}
              className="w-full translator-rounded translator-primary px-4 py-2.5 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach Files
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html,.xml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />

          {/* Progress/Error/Success Messages */}
          {progress && (
            <div className="translator-rounded translator-border p-4 text-sm flex items-start gap-3" style={{ backgroundColor: "oklch(0.9 0.05 250 / 0.15)" }}>
              <svg className="h-5 w-5 mt-0.5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="flex-1">
                <p className="font-medium">{progress}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="translator-rounded translator-border translator-destructive-bg-light p-4 text-sm translator-destructive">
              <p className="font-medium">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="translator-rounded translator-border p-4 text-sm" style={{ backgroundColor: "oklch(0.9 0.05 150 / 0.15)" }}>
              <p className="font-medium">{success}</p>
            </div>
          )}

          {/* Selected Files List */}
          {(uploadedFiles.length > 0 || selectedBlobFiles.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold translator-text-foreground">
                  Selected Files ({uploadedFiles.length + selectedBlobFiles.length}) • {totalFileSizeMB} MB
                </h3>
                <button 
                  onClick={handleClear} 
                  disabled={isLoading}
                  className="text-xs font-medium translator-muted-foreground hover:translator-text-foreground"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Uploaded files */}
                {uploadedFiles.map((file, index) => {
                  const icon = getFileIcon(file.name)
                  return (
                    <div key={`upload-${index}`} className="flex items-center justify-between translator-rounded translator-card translator-border p-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs" style={{ backgroundColor: icon.bg, color: icon.color }}>
                          {icon.text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm translator-text-foreground truncate font-medium">{file.name}</p>
                          <p className="text-xs translator-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeUploadedFile(index)}
                        disabled={isLoading}
                        className="text-xs font-medium translator-destructive translator-rounded px-3 py-1.5 hover:translator-destructive-bg-light"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
                {/* Selected blob files */}
                {selectedBlobFiles.map((file, index) => {
                  const icon = getFileIcon(file.cleanName)
                  return (
                    <div key={`blob-${index}`} className="flex items-center justify-between translator-rounded translator-card translator-border p-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs" style={{ backgroundColor: icon.bg, color: icon.color }}>
                          {icon.text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm translator-text-foreground truncate font-medium">{file.cleanName}</p>
                          <p className="text-xs translator-muted-foreground">{formatFileSize(file.size)} • From Storage</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleBlobFileSelection(file)}
                        disabled={isLoading}
                        className="text-xs font-medium translator-destructive translator-rounded px-3 py-1.5 hover:translator-destructive-bg-light"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={(uploadedFiles.length === 0 && selectedBlobFiles.length === 0) || isLoading}
            className="w-full translator-rounded translator-primary px-6 py-3.5 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Translating...
              </span>
            ) : (
              `Translate ${uploadedFiles.length + selectedBlobFiles.length} File${(uploadedFiles.length + selectedBlobFiles.length) !== 1 ? "s" : ""}`
            )}
          </button>
        </>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold translator-text-foreground">Blob Storage Files</h3>
            <button
              onClick={loadBlobFiles}
              disabled={loadingFiles}
              className="text-sm translator-primary-text hover:opacity-80 flex items-center gap-2"
            >
              <svg className={`h-4 w-4 ${loadingFiles ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Source Files */}
          <div className="space-y-3">
            <h4 className="font-medium translator-text-foreground">Source Files (inputdocuments)</h4>
            {loadingFiles ? (
              <div className="text-center py-8 translator-muted-foreground">Loading...</div>
            ) : blobFiles.source.length === 0 ? (
              <div className="text-center py-8 translator-muted-foreground">No files in source container</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blobFiles.source.map((file, idx) => {
                  const icon = getFileIcon(file.cleanName)
                  return (
                    <div key={idx} className="flex items-center justify-between translator-rounded translator-card translator-border p-3 hover:translator-muted">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs" style={{ backgroundColor: icon.bg, color: icon.color }}>
                          {icon.text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm translator-text-foreground truncate font-medium">{file.cleanName}</p>
                          <p className="text-xs translator-muted-foreground">
                            {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadBlobFile("inputdocuments", file.originalName)}
                          className="text-xs font-medium translator-primary-text translator-rounded px-3 py-1.5 hover:opacity-80"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => deleteBlobFile("inputdocuments", file.originalName)}
                          className="text-xs font-medium translator-destructive translator-rounded px-3 py-1.5 hover:translator-destructive-bg-light"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Target Files */}
          <div className="space-y-3">
            <h4 className="font-medium translator-text-foreground">Translated Files (documentstraslated)</h4>
            {loadingFiles ? (
              <div className="text-center py-8 translator-muted-foreground">Loading...</div>
            ) : blobFiles.target.length === 0 ? (
              <div className="text-center py-8 translator-muted-foreground">No translated files yet</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blobFiles.target.map((file, idx) => {
                  const icon = getFileIcon(file.cleanName)
                  return (
                    <div key={idx} className="flex items-center justify-between translator-rounded translator-card translator-border p-3 hover:translator-muted">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs" style={{ backgroundColor: icon.bg, color: icon.color }}>
                          {icon.text}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm translator-text-foreground truncate font-medium">{file.cleanName}</p>
                          <p className="text-xs translator-muted-foreground">
                            {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadBlobFile("documentstraslated", file.originalName)}
                        className="text-xs font-medium translator-primary-text translator-rounded px-3 py-1.5 hover:opacity-80"
                      >
                        Download
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {characterCount !== null && (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Total Characters: <span className="font-semibold">{characterCount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Estimated Cost: <span className="font-semibold text-blue-600">${estimatedCost} USD</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Document Translation: $15 per million characters)
          </p>
        </div>
        {countingCharacters && (
          <div className="text-sm text-gray-500">Counting...</div>
        )}
      </div>
    </div>
  )}
    </div>
  )
}

