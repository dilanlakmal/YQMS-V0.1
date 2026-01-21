import { useState, useEffect, useRef } from "react";
import {
  MdOutlineTranslate,
  MdOutlineSyncAlt,
  MdTranslate,
  MdContentCopy,
  MdClose,
  MdUploadFile,
  MdHistory,
  MdStarBorder,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { IoDocumentTextOutline, IoLanguage, IoText } from "react-icons/io5";
import { cn } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AzureTranslator() {
  const languages = ["Detect language", "Khmer", "English", "Chinese", "Spanish", "French", "Japanese", "Korean"];

  const [translateType, setTranslateType] = useState("text"); // 'text' | 'document'
  const [fromLanguage, setFromLanguage] = useState(languages[0]);
  const [toLanguage, setToLanguage] = useState("English");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);

  // Mock translation effect
  useEffect(() => {
    if (!inputText) {
      setOutputText("");
      return;
    }
    const timer = setTimeout(() => {
      // Simulate translation result
      setOutputText(`${inputText} [Translated to ${toLanguage}]`);
    }, 800);
    return () => clearTimeout(timer);
  }, [inputText, toLanguage]);

  const handleSwapLanguages = () => {
    if (fromLanguage === "Detect language") return;
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
    setInputText(outputText.replace(/ \[Translated to .*\]/, "")); // simplistic swap logic
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <Header
        toggleGlossary={() => setShowGlossary(!showGlossary)}
        showGlossary={showGlossary}
      />

      <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full p-4 gap-6">

        {/* Main Translation Content */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Mode Selector */}
          <div className="flex justify-center pb-2">
            <div className="bg-white p-1 rounded-full shadow-sm border border-slate-200 inline-flex">
              <ModeButton
                active={translateType === "text"}
                onClick={() => setTranslateType("text")}
                icon={<IoText className="w-4 h-4" />}
                label="Text"
              />
              <ModeButton
                active={translateType === "document"}
                onClick={() => setTranslateType("document")}
                icon={<IoDocumentTextOutline className="w-4 h-4" />}
                label="Documents"
              />
            </div>
          </div>

          {/* Translation Card */}
          <div className="flex-1 flex flex-col md:flex-row bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10">

            {/* Source Side */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 relative group">
              <LanguageHeader
                selected={fromLanguage}
                onChange={setFromLanguage}
                options={languages}
                type="source"
              />
              <div className="flex-1 relative p-6">
                {translateType === 'text' ? (
                  <textarea
                    className="w-full h-full resize-none text-lg bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300 text-slate-700 leading-relaxed"
                    placeholder="Enter text to translate..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <FileUploader />
                )}
                {inputText && translateType === 'text' && (
                  <button
                    onClick={() => setInputText("")}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="p-4 flex justify-between items-center text-slate-400 text-sm border-t border-slate-50">
                <span>{inputText.length} chars</span>
                <button className="hover:text-blue-600 transition flex items-center gap-1">
                  <MdKeyboardArrowDown className="w-4 h-4" /> History
                </button>
              </div>
            </div>

            {/* Swap Button (Absolute Centered) */}
            <div className="absolute top-[3.5rem] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 md:block hidden">
              <button
                onClick={handleSwapLanguages}
                className="bg-white border border-slate-200 p-2 rounded-full shadow-md text-slate-500 hover:text-blue-600 hover:rotate-180 transition-all duration-300"
                title="Swap languages"
              >
                <MdOutlineSyncAlt className="w-5 h-5" />
              </button>
            </div>

            {/* Target Side */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
              <LanguageHeader
                selected={toLanguage}
                onChange={setToLanguage}
                options={languages.filter(l => l !== "Detect language")}
                type="target"
              />
              <div className="flex-1 p-6 relative">
                {translateType === 'text' ? (
                  <>
                    {outputText ? (
                      <div className="text-lg text-slate-800 leading-relaxed">
                        {outputText}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 select-none">
                        <span className="bg-slate-100/50 px-4 py-2 rounded-lg text-sm">Translation will appear here</span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {outputText && (
                        <ActionButton icon={<MdContentCopy />} label="Copy" onClick={() => navigator.clipboard.writeText(outputText)} />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <IoDocumentTextOutline className="w-16 h-16 opacity-20 mb-4" />
                    <p>Document translation output</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                {outputText && (
                  <button className="text-slate-400 hover:text-amber-500 transition">
                    <MdStarBorder className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Side Panel (Glossary & Tools) */}
        <AnimatePresence>
          {showGlossary && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col"
            >
              <GlossaryPanel onClose={() => setShowGlossary(false)} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

// --- Sub Components ---

function Header({ toggleGlossary, showGlossary }) {
  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-600/20">
          <MdTranslate className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Azure Translate</h1>
      </div>
      <div className="flex gap-2">
        <button
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
          title="History"
        >
          <MdHistory className="w-6 h-6" />
        </button>
        <button
          onClick={toggleGlossary}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            showGlossary
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <IoLanguage className="w-4 h-4" /> Glossary
        </button>
      </div>
    </header>
  );
}

function ModeButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {icon} {label}
    </button>
  );
}

function LanguageHeader({ selected, onChange, options, type }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-semibold transition px-2 py-1 rounded-md hover:bg-slate-50"
      >
        {selected} <MdKeyboardArrowDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-12 left-4 w-60 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-2 z-50 flex flex-col max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Language</div>
          {options.map((lang) => (
            <button
              key={lang}
              onClick={() => { onChange(lang); setIsOpen(false); }}
              className={cn(
                "text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition",
                selected === lang ? "text-blue-600 font-medium bg-blue-50/50" : "text-slate-600"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 hover:shadow-md transition flex items-center justify-center"
      title={label}
    >
      {icon}
    </button>
  );
}

function FileUploader() {
  return (
    <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-4 hover:border-blue-400 hover:bg-blue-50/10 transition cursor-pointer group">
      <div className="p-4 bg-slate-50 rounded-full group-hover:scale-110 transition">
        <MdUploadFile className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-slate-600 font-medium group-hover:text-blue-600">Click to upload or drag and drop</p>
        <p className="text-sm">Supported: .pdf, .docx, .txt</p>
      </div>
      <input type="file" className="hidden" />
    </div>
  )
}

function GlossaryPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState("pairs");

  return (
    <div className="flex flex-col h-full w-[320px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <IoLanguage className="text-blue-500" /> Glossary
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
          <MdClose className="w-5 h-5" />
        </button>
      </div>

      <div className="flex p-2 gap-2 border-b border-slate-100">
        {['pairs', 'files'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 text-sm rounded-md capitalize font-medium transition",
              activeTab === tab
                ? "bg-blue-100 text-blue-700"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'pairs' ? (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
              Custom terms will be prioritized during translation.
            </div>
            {/* Mock Glossary Items */}
            <GlossaryItem term="Hello" translation="Bonjour" />
            <GlossaryItem term="World" translation="Monde" />
            <GlossaryItem term="Computer" translation="Ordinateur" />

            <button className="w-full py-2 mt-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition">
              + Add new term
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-8">
              <MdUploadFile className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Upload a glossary file (.csv, .tmx)</p>
            </div>
            <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-900 transition shadow-lg shadow-slate-200">
              Upload Glossary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GlossaryItem({ term, translation }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition cursor-default">
      <div>
        <div className="text-sm font-medium text-slate-800">{term}</div>
        <div className="text-xs text-slate-500">{translation}</div>
      </div>
      <button className="text-slate-300 hover:text-red-400">
        <MdClose className="w-4 h-4" />
      </button>
    </div>
  )
}
