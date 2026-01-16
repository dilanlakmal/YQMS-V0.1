import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Check, AlertCircle, RefreshCw, Globe, ChevronRight, ArrowRightLeft, BookOpen, Download, Edit2, X, Loader2 } from "lucide-react";
import TranslationEditor from './TranslationEditor';
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
  const [translationResult, setTranslationResult] = useState(null) // New state for storing translation results
  const [targetLanguage, setTargetLanguage] = useState("km")
  const [selectedLanguagePair, setSelectedLanguagePair] = useState('en-km');
  const [editorState, setEditorState] = useState(null); // { sourceFile, targetFile, sourceLang, targetLang } // Change from "en" to "auto"
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
  const [domain, setDomain] = useState("General");

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

  // Helper to find the best matching translated file for a given source
  const getMostRecentTranslation = (sourceFile, targetFiles) => {
    if (!sourceFile || !targetFiles) return null;

    const sourceName = sourceFile.name || sourceFile.cleanName || sourceFile.originalName;
    // Handle files with no extension or weird names safely
    const lastDotIndex = sourceName.lastIndexOf('.');
    const sourceBase = lastDotIndex !== -1 ? sourceName.substring(0, lastDotIndex) : sourceName;
    const sourceExt = lastDotIndex !== -1 ? sourceName.substring(lastDotIndex + 1).toLowerCase() : "";

    // Normalize for comparison: remove all non-alphanumeric characters to handle spaces vs underscores
    // This handles the case where backend sanitizes "File Name" to "File_Name"
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedSourceBase = normalize(sourceBase);

    // Find best candidate from target files
    const candidates = targetFiles.filter(tf => {
      const tfName = tf.cleanName;
      const tfLastDotIndex = tfName.lastIndexOf('.');
      const tfExt = tfLastDotIndex !== -1 ? tfName.substring(tfLastDotIndex + 1).toLowerCase() : "";

      if (tfExt !== sourceExt) return false;

      const { baseName } = parseTranslatedFileName(tfName);
      // Compare normalized bases
      return normalize(baseName) === normalizedSourceBase;
    });

    // Sort by date descending (newest first)
    candidates.sort((a, b) => {
      const dateA = new Date(a.lastModified).getTime();
      const dateB = new Date(b.lastModified).getTime();
      return dateB - dateA;
    });

    return candidates.length > 0 ? candidates[0] : null;
  };

  // Polling effect: When there is a translation result, keep checking for files until they appear
  useEffect(() => {
    if (!translationResult) return;

    let attempts = 0;
    const maxAttempts = 60; // 2 minutes approx
    const intervalStr = 2000;

    const checkAndReload = async () => {
      // Check if we have matched all files yet
      const allFound = translationResult.sourceFiles.every(source => {
        return getMostRecentTranslation(source, blobFiles.target);
      });

      if (allFound) {
        // Stop polling if done
        return;
      }

      // Reload
      await loadBlobFiles();
      attempts++;
    };

    // Initial check is handled by the immediate loadBlobFiles call after translate
    // We just set interval here
    const timer = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        return;
      }
      checkAndReload();
    }, intervalStr);

    return () => clearInterval(timer);
  }, [translationResult]); // Dependency on translationResult ensures we start when a new job finishes

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
        `${API_BASE_URL} /api/translate - files / delete? container = ${container}& fileName=${encodeURIComponent(fileName)} `,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      setSuccess(`Deleted: ${fileName} `)
      setTimeout(() => setSuccess(""), 3000)
      loadBlobFiles() // Reload files
    } catch (err) {
      setError(`Failed to delete ${fileName}: ${err.message} `)
    }
  }

  /**
   * Parse translated filename into base name and language code.
   * Pattern: base_langCode_uuid.ext
   * Example: test_with_glossaries_zh-Hans_1234abcd.docx
   *   -> { baseName: "test_with_glossaries", langCode: "zh-hans" }
   */
  const parseTranslatedFileName = (filename) => {
    if (!filename) {
      return { baseName: "", langCode: null };
    }

    const withoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = withoutExt.split("_");

    if (parts.length < 3) {
      // Doesn't match expected pattern; treat whole name as base
      return { baseName: withoutExt, langCode: null };
    }

    const guid = parts[parts.length - 1]; // last segment
    const lang = parts[parts.length - 2]; // second last segment
    const base = parts.slice(0, parts.length - 2).join("_");

    // Basic guard to ensure this looks like our pattern
    if (!guid || !lang) {
      return { baseName: withoutExt, langCode: null };
    }

    return {
      baseName: base,
      langCode: lang.toLowerCase()
    };
  };

  /**
   * Extract language code from translated filename
   * @param {string} filename - Translated filename
   * @returns {string|null} - Language code (e.g., "km", "en", "zh-hans") or null if not found
   */
  const extractLanguageCode = (filename) => {
    const { langCode } = parseTranslatedFileName(filename);
    return langCode || null;
  };

  /**
   * Get language pair display from translated filename
   * @param {string} translatedFilename - Translated filename
   * @param {string} defaultSource - Default source language (default: "en")
   * @returns {string} - Language pair display (e.g., "en→km")
   */
  const getLanguagePairDisplay = (translatedFilename, defaultSource = "en") => {
    const targetLang = extractLanguageCode(translatedFilename);
    if (targetLang) {
      return `${defaultSource}→${targetLang} `;
    }
    return "";
  };

  /**
   * Match input files with their translated counterparts.
   * - If both input and translated exist: pair each translated file with the input.
   * - If only input exists: show input with \"Not translated yet\" on the right.
   * - If only translated exists (source deleted from storage): still show the translated file
   *   with a \"Source file not found\" message on the left.
   *
   * @param {Array} inputFiles - Source files from storage
   * @param {Array} translatedFiles - Translated files from storage
   * @returns {Array} - Array of matched pairs: { input, translated }
   */
  const matchInputToTranslated = (inputFiles, translatedFiles) => {
    const pairsMap = new Map();

    // Seed map with all input files
    inputFiles.forEach((inputFile) => {
      const baseName = inputFile.cleanName.replace(/\.[^/.]+$/, "");
      const key = baseName.toLowerCase();

      if (!pairsMap.has(key)) {
        pairsMap.set(key, { input: null, translatedCandidates: [] });
      }

      const entry = pairsMap.get(key);
      entry.input = inputFile;
    });

    // Add translated files, even if input no longer exists
    translatedFiles.forEach((tf) => {
      const { baseName } = parseTranslatedFileName(tf.cleanName);
      const key = (baseName || "").toLowerCase();
      if (!key) return;

      if (!pairsMap.has(key)) {
        pairsMap.set(key, { input: null, translatedCandidates: [] });
      }

      const entry = pairsMap.get(key);
      entry.translatedCandidates.push(tf);
    });

    // Build final array: one row per translated file, plus rows for inputs without translations
    const pairs = [];

    pairsMap.forEach((value) => {
      if (value.translatedCandidates.length > 0) {
        // Create a row for each translated document
        value.translatedCandidates.forEach((tf) => {
          pairs.push({
            input: value.input || null,
            translated: tf
          });
        });
      } else if (value.input) {
        // Input with no translations yet
        pairs.push({
          input: value.input,
          translated: null
        });
      }
    });

    // Sort by date (newest first), then by name
    return pairs.sort((a, b) => {
      const getPairDate = (p) => {
        const tDate = p.translated?.lastModified ? new Date(p.translated.lastModified).getTime() : 0;
        const iDate = p.input?.lastModified ? new Date(p.input.lastModified).getTime() : 0;
        return Math.max(tDate, iDate);
      };

      const dateA = getPairDate(a);
      const dateB = getPairDate(b);

      if (dateB !== dateA) {
        return dateB - dateA;
      }

      const nameA =
        (a.input?.cleanName || parseTranslatedFileName(a.translated?.cleanName || "").baseName || "").toLowerCase();
      const nameB =
        (b.input?.cleanName || parseTranslatedFileName(b.translated?.cleanName || "").baseName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Helper to find remote source candidate for a local source file
  const getRemoteSourceCandidate = (sourceFile, sourceBlobs) => {
    // If it already has a container, it's a blob.
    if (sourceFile.container) return sourceFile;

    const localName = sourceFile.name; // Browser File object has .name
    if (!localName) return null;

    // Backend sanitize logic approximation:
    // It replaces special chars with _.
    // And prepends a UUID.
    const normalize = (str) => str.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeName = normalize(localName);

    // Find blobs that contain this name (loosely)
    const candidates = sourceBlobs.filter(b => {
      // Check against originalName first if listed (backend now returns it)
      if (b.originalName && (
        b.originalName === localName ||
        b.originalName.endsWith(localName)
      )) return true;

      return b.name && (
        b.name.includes(safeName) ||
        b.name.includes(localName)
      );
    });

    // Sort by date descending (newest first)
    candidates.sort((a, b) => {
      const dateA = new Date(a.lastModified).getTime();
      const dateB = new Date(b.lastModified).getTime();
      return dateB - dateA;
    });

    return candidates.length > 0 ? candidates[0] : null;
  };

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
        blobFiles.target.find(f => f.originalName === fileName) ||
        // If not found in current list, try to construct one
        { cleanName: fileName }

      const downloadName = file?.cleanName || fileName

      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccess(`Downloaded: ${downloadName} `)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(`Failed to download: ${err.message} `)
    }
  }

  const openBlobFile = async (container, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/translate-files/download?container=${container}&fileName=${encodeURIComponent(fileName)}`
      )

      if (!response.ok) {
        throw new Error("Open failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Clean up URL object after a delay to allow new window to load
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)

    } catch (err) {
      setError(`Failed to open: ${err.message} `)
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
        return `Invalid file type: ${file.name}.Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, HTML, XML`
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
    // countCharacters(updatedFiles); // Removed pre-translation estimate
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
      // countCharacters(updatedFiles); // Removed pre-translation estimate
    }
    e.target.value = ""
  }

  const removeUploadedFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    // countCharacters(updatedFiles); // Removed pre-translation estimate
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

      const response = await fetch(`${API_BASE_URL} /api/translate - files / character - count`, {
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

      // Add domain
      formData.append("domain", domain)

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
        // Store result for display instead of just success text
        setTranslationResult({
          sourceFiles: [...uploadedFiles, ...selectedBlobFiles],
          timestamp: new Date()
        })

        // UPDATE: Set actual cost and character count from Azure response
        if (data.cost) {
          setCharacterCount(data.cost.totalCharactersCharged);
          // Ensure it's a number
          setEstimatedCost(parseFloat(data.cost.estimatedCost));
        }

        setUploadedFiles([])
        setSelectedBlobFiles([])

        // Load files immediately to ensure we can match results
        loadBlobFiles()
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
    setTranslationResult(null)
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
          className={`px - 4 py - 2 font - medium transition - colors ${activeTab === "upload"
            ? "translator-primary-text border-b-2 border-primary"
            : "translator-muted-foreground hover:translator-text-foreground"
            } `}
        >
          Upload & Translate
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`px - 4 py - 2 font - medium transition - colors ${activeTab === "files"
            ? "translator-primary-text border-b-2 border-primary"
            : "translator-muted-foreground hover:translator-text-foreground"
            } `}
        >
          My Files
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <>
          {/* Language Selection Header */}
          <div className="flex flex-col md:flex-row translator-card translator-rounded mb-6">
            {/* Source Language */}
            <div className="flex-1 min-w-0">
              <LanguageSelector
                value={sourceLanguage}
                onChange={(lang) => {
                  setSourceLanguage(lang);
                  setSelectedGlossary(null);
                }}
                includeAuto={true}
                recentLanguages={['auto', 'en', 'zh-Hans', 'km']}
                variant="tabs"
              />
            </div>

            {/* Swap Button */}
            <div className="hidden md:flex items-center justify-center px-2 border-l border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
              <button
                onClick={() => {
                  if (sourceLanguage !== 'auto') {
                    setSourceLanguage(targetLanguage);
                    setTargetLanguage(sourceLanguage);
                    setSelectedGlossary(null);
                  }
                }}
                className={`p - 2 rounded - full hover: bg - gray - 100 dark: hover: bg - gray - 700 transition - colors text - gray - 500 ${sourceLanguage === 'auto' ? 'opacity-50 cursor-not-allowed' : ''} `}
                title="Swap languages"
                disabled={sourceLanguage === 'auto'}
              >
                <ArrowRightLeft size={20} />
              </button>
            </div>

            {/* Target Language */}
            <div className="flex-1 min-w-0">
              <LanguageSelector
                value={targetLanguage}
                onChange={(lang) => {
                  setTargetLanguage(lang);
                  setSelectedGlossary(null);
                }}
                recentLanguages={['en', 'zh-Hans', 'km']}
                variant="tabs"
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

          {/* Domain Selection */}
          <div className="flex items-center gap-4 mb-4 p-4 translator-card translator-rounded bg-white/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">Domain</span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">Specialized glossary focus</p>
            </div>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none flex-1 max-w-xs transition-shadow shadow-sm"
            >
              <option value="General">General (Default)</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="Building">Building</option>
              <option value="Medical">Medical</option>
            </select>
          </div>

          {/* Main Content Area */}
          <div className="translator-card translator-rounded min-h-[400px] flex flex-col items-center justify-center p-8">

            {/* 1. Empty State: Upload Area (Split Columns) */}
            {uploadedFiles.length === 0 && selectedBlobFiles.length === 0 && !translationResult && (
              <div
                className="flex w-full max-w-4xl gap-8"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {/* Left Column: Drag & Drop */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-gray-200 dark:border-gray-700">
                  <div className="w-40 h-32 mb-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-center">
                    <svg className="w-20 h-20 text-blue-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-normal text-gray-700 dark:text-gray-200">Drag and drop</h3>
                </div>

                {/* Right Column: Browse Files */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <p className="text-gray-500 mb-6 text-lg">Or choose a file</p>
                  <button
                    onClick={handleAttachmentClick}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded text-sm font-medium transition-colors shadow-sm mb-4 w-full max-w-[200px]"
                  >
                    Browse your files
                  </button>
                  <p className="text-xs text-gray-400 text-center max-w-[200px]">
                    Supported file types: .docx, .pdf, .pptx, .xlsx
                  </p>
                </div>
              </div>
            )}

            {/* 2. Selected State (Pre-translation) */}
            {(uploadedFiles.length > 0 || selectedBlobFiles.length > 0) && !translationResult && (
              <div className="w-full max-w-2xl">
                <div className="grid gap-4">
                  {[...uploadedFiles, ...selectedBlobFiles].map((file, idx) => {
                    const isBlob = !!file.container; // simplistic check
                    const fileName = file.name || file.cleanName;
                    const fileSize = file.size;
                    const icon = getFileIcon(fileName);

                    return (
                      <div key={idx} className="flex items-center justify-between translator-muted p-4 rounded-lg translator-border border">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 flex items-center justify-center rounded translator-card shadow-sm text-gray-500">
                            {/* Simple File Icon */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate pr-4">{fileName}</h4>
                            <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => isBlob ? toggleBlobFileSelection(file) : removeUploadedFile(idx)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Translate Action */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleTranslate}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                    {isLoading ? "Translating..." : "Translate"}
                  </button>
                </div>
              </div>
            )}

            {/* 3. Result State (Post-translation) */}
            {translationResult && (
              <div className="w-full max-w-2xl">
                <div className="grid gap-4">
                  {(() => {
                    return translationResult.sourceFiles.map((sourceFile, idx) => {
                      const matched = getMostRecentTranslation(sourceFile, blobFiles.target);
                      const remoteSource = getRemoteSourceCandidate(sourceFile, blobFiles.source);
                      const isFound = !!matched;

                      return (
                        <div key={idx} className="flex items-center justify-between translator-card p-6 rounded-lg translator-border border shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{sourceFile.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  {isFound ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <Check className="w-4 h-4" /> Translated
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                                    </span>
                                  )}
                                </span>
                                <span>•</span>
                                <span>{(sourceFile.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {matched ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => downloadBlobFile(matched.container || "documentstraslated", matched.originalName)}
                                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors border border-gray-200 flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button
                                  onClick={() => openBlobFile(matched.container || "documentstraslated", matched.originalName)}
                                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 flex items-center gap-1"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  Open
                                </button>
                                {/* AI Editor Button */}
                                {remoteSource && (
                                  <button
                                    onClick={() => setEditorState({
                                      sourceFile: remoteSource,
                                      targetFile: matched,
                                      sourceLang: sourceLanguage === 'auto' ? 'en' : sourceLanguage,
                                      targetLang: targetLanguage
                                    })}
                                    className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors border border-purple-200 flex items-center gap-1"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    Correct in AI Editor
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Translating...</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html,.xml"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />

            {/* Error/Progress Overlays */}
            {progress && (
              <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4 text-blue-500" />
                {progress}
              </div>
            )}

            {error && (
              <div className="mt-6 w-full max-w-2xl bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
                {error}
              </div>
            )}

          </div>
        </>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold translator-text-foreground">Files</h3>
            <button
              onClick={loadBlobFiles}
              disabled={loadingFiles}
              className="text-sm translator-primary-text hover:opacity-80 flex items-center gap-2"
            >
              <svg className={`h - 4 w - 4 ${loadingFiles ? "animate-spin" : ""} `} fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loadingFiles ? (
            <div className="text-center py-8 translator-muted-foreground">Loading...</div>
          ) : blobFiles.source.length === 0 && blobFiles.target.length === 0 ? (
            <div className="text-center py-8 translator-muted-foreground">No files found</div>
          ) : (
            <div className="translator-rounded translator-border translator-card overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-2 translator-border-b bg-muted/30">
                <div className="px-4 py-3">
                  <h4 className="font-medium translator-text-foreground">Input Documents</h4>
                </div>
                <div className="px-4 py-3 translator-border-l">
                  <h4 className="font-medium translator-text-foreground">Translated Documents</h4>
                </div>
              </div>

              {/* Matched Files */}
              <div className="max-h-[600px] overflow-y-auto">
                {(() => {
                  const pairs = matchInputToTranslated(blobFiles.source, blobFiles.target);
                  let lastDateGroup = null;

                  if (pairs.length === 0) {
                    return <div className="p-8 text-center text-gray-500">No files found</div>;
                  }

                  return pairs.map((pair, idx) => {
                    const rawDate = pair.translated?.lastModified || pair.input?.lastModified;
                    const dateGroup = rawDate
                      ? new Date(rawDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : "Earlier";

                    const showHeader = dateGroup !== lastDateGroup;
                    lastDateGroup = dateGroup;

                    const hasInput = !!pair.input;
                    const inputIcon = hasInput
                      ? getFileIcon(pair.input.cleanName)
                      : { text: "?", bg: "#E5E7EB", color: "#6B7280" };
                    const translatedIcon = pair.translated ? getFileIcon(pair.translated.cleanName) : null;

                    return (
                      <React.Fragment key={idx}>
                        {showHeader && (
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-y border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                            {dateGroup}
                          </div>
                        )}
                        <div className="grid grid-cols-2 translator-border-b hover:bg-muted/20">
                          {/* Input File Column */}
                          <div className="px-4 py-3 translator-border-r">
                            {hasInput ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span
                                    className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs flex-shrink-0"
                                    style={{ backgroundColor: inputIcon.bg, color: inputIcon.color }}
                                  >
                                    {inputIcon.text}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm translator-text-foreground truncate font-medium">
                                      {pair.input.cleanName}
                                    </p>
                                    <p className="text-xs translator-muted-foreground">
                                      {formatFileSize(pair.input.size)} • {formatDate(pair.input.lastModified)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => downloadBlobFile("inputdocuments", pair.input.originalName)}
                                    className="text-xs font-medium translator-primary-text translator-rounded px-2 py-1 hover:opacity-80"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => deleteBlobFile("inputdocuments", pair.input.originalName)}
                                    className="text-xs font-medium translator-destructive translator-rounded px-2 py-1 hover:translator-destructive-bg-light"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span
                                    className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs flex-shrink-0"
                                    style={{ backgroundColor: inputIcon.bg, color: inputIcon.color }}
                                  >
                                    {inputIcon.text}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm translator-muted-foreground font-medium truncate">
                                      Source file not found in storage
                                    </p>
                                    <p className="text-xs translator-muted-foreground">
                                      This translation was created from a file that has since been removed.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Translated File Column */}
                          <div className="px-4 py-3">
                            {pair.translated ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs flex-shrink-0" style={{ backgroundColor: translatedIcon.bg, color: translatedIcon.color }}>
                                    {translatedIcon.text}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm translator-text-foreground truncate font-medium">{pair.translated.cleanName}</p>
                                      {getLanguagePairDisplay(pair.translated.cleanName) && (
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium translator-rounded bg-primary/10 text-primary whitespace-nowrap">
                                          {getLanguagePairDisplay(pair.translated.cleanName)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs translator-muted-foreground">
                                      {formatFileSize(pair.translated.size)} • {formatDate(pair.translated.lastModified)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => downloadBlobFile("documentstraslated", pair.translated.originalName)}
                                    className="text-xs font-medium translator-primary-text translator-rounded px-2 py-1 hover:opacity-80"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => deleteBlobFile("documentstraslated", pair.translated.originalName)}
                                    className="text-xs font-medium translator-destructive translator-rounded px-2 py-1 hover:translator-destructive-bg-light"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center h-full">
                                <p className="text-sm translator-muted-foreground italic">Not translated yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
      {characterCount !== null && (
        <div className="mb-4 p-4 translator-card translator-border border rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm translator-text-foreground">
                Total Characters: <span className="font-semibold">{characterCount.toLocaleString()}</span>
              </p>
              <p className="text-sm translator-primary-text mt-1">
                Estimated Cost: <span className="font-semibold">${estimatedCost} USD</span>
              </p>
              <p className="text-xs translator-muted-foreground mt-1">
                (Document Translation: $15 per million characters)
              </p>
            </div>
            {countingCharacters && (
              <div className="text-sm translator-muted-foreground">Counting...</div>
            )}
          </div>
        </div>
      )}
      {/* Editor Modal */}
      {editorState && (
        <TranslationEditor
          isOpen={!!editorState}
          onClose={() => setEditorState(null)}
          sourceFile={editorState.sourceFile}
          targetFile={editorState.targetFile}
          sourceLang={editorState.sourceLang}
          targetLang={editorState.targetLang}
          domain={domain}
        />
      )}
    </div>
  )
}

