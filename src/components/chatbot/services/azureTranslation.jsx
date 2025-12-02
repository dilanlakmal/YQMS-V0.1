import { useState, useEffect } from "react";
import {
  MdOutlineTranslate,
  MdOutlineSyncAlt,
  MdTranslate,
} from "react-icons/md";
import { cn } from "@/components/chatbot/lib/utils";
import { IoDocumentText } from "react-icons/io5";
import { GrFormDown } from "react-icons/gr";

export default function AzureTranslator() {
  const languages = ["Detect language", "Khmer", "English", "Chinese"];

  const [translateType, setTranslateType] = useState("text");
  const [fromLanguage, setFromLanguage] = useState(languages[0]);
  const [sourceLanguages, setSourceLangues] = useState([]);
  const [targetLanguages, setTargetLanguage] = useState([]);
  const [toLanguage, setToLanguage] = useState("");

  useEffect(() => {
    setSourceLangues(languages);
    setTargetLanguage(
      languages.filter(
        (lang) => lang !== fromLanguage && lang !== "Detect language",
      ),
    );
  }, [fromLanguage, languages]);

  useEffect(() => {
    if (!sourceLanguages.includes(toLanguage)) {
      setToLanguage(sourceLanguages[0]);
    }
  }, [fromLanguage]);

  // const fromLanguages = languages;
  // const toLanguages = languages.filter((lang) => !fromLanguages.includes(lang));

  return (
    <div className="flex flex-col bg-black text-white p-4 w-full h-full gap-4">
      {/* Header */}
      <Header />

      {/* Translation Type Selector */}
      <div className="bg-white text-black flex items-center p-5 gap-8 rounded-md shadow">
        <TranslateType
          translateType={translateType}
          setTranslateType={setTranslateType}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-3">
        {/* Input/Output Language Sections */}
        <div className="flex flex-1 gap-3 items-start">
          <SelectLanguage
            languages={sourceLanguages}
            languageSelected={fromLanguage}
            onChangeLanguage={setFromLanguage}
            areaType="input"
            translateType={translateType}
          />

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <MdOutlineSyncAlt className="w-6 h-6 text-white cursor-pointer hover:text-gray-300" />
          </div>

          <SelectLanguage
            languages={targetLanguages}
            languageSelected={toLanguage}
            onChangeLanguage={setToLanguage}
            areaType="output"
            translateType={translateType}
          />
        </div>

        {/* Glossary Sidebar */}
        <div className="bg-neutral-800 w-1/3 flex items-start justify-center p-4 rounded-md shadow">
          <Glossary />
        </div>
      </div>
    </div>
  );
}

function TranslateType({ translateType, setTranslateType }) {
  const types = [
    {
      icon: <MdOutlineTranslate className="w-6 h-6" />,
      onChange: "text",
      title: "Text",
    },
    {
      icon: <IoDocumentText className="w-6 h-6 " />,
      onChange: "document",
      title: "Documents",
    },
  ];
  return (
    <>
      {types.map((type) => (
        <button
          className={cn(
            "p-3 border flex gap-3 rounded-xl items-center",
            translateType === type.onChange ? "bg-blue-200" : "bg-none",
          )}
          onClick={() => setTranslateType(type.onChange)}
        >
          {type.icon}
          <span>{type.title}</span>
        </button>
      ))}
    </>
  );
}

function SelectLanguage({
  languages,
  languageSelected,
  onChangeLanguage,
  areaType,
  translateType,
}) {
  return (
    <div className="bg-white w-1/2 h-full flex flex-col items-start p-4 rounded-md shadow">
      {/* Language Selector */}
      <ul className="flex items-center space-x-4 mb-4 pl-8 ">
        {languages.map((language, index) => (
          <li key={index}>
            <button
              className={`text-black font-medium ${
                language === languageSelected
                  ? "text-blue-800 border-b-2 border-blue-950 pb-1"
                  : "hover:text-gray-600"
              } transition-colors duration-200`}
              onClick={() => onChangeLanguage(language)}
            >
              {language}
            </button>
          </li>
        ))}

        {/* Dropdown Icon */}
        <li>
          <button className="flex items-center justify-center p-1 hover:bg-gray-200 rounded">
            <GrFormDown className="w-6 h-6 text-black" />
          </button>
        </li>
      </ul>

      {/* Input / Output Area */}
      <div className="flex-1 w-full">
        <InputArea areaType={areaType} translateType={translateType} />
      </div>
    </div>
  );
}

function InputArea({ areaType, translateType }) {
  // Base classes for both textareas
  const baseClasses =
    "border border-gray-600 w-[85%] h-[70%] box-border resize-none text-black p-2";
  const filesInput =
    areaType === "output" ? "" : <input type="file" multiple />;
  const textInput = (
    <textarea
      readOnly={areaType === "output"}
      className={baseClasses}
      placeholder={areaType === "output" ? "Output area" : "Input area"}
    />
  );
  return (
    <div className="w-full h-full flex justify-center items-start">
      {translateType === "text" ? textInput : filesInput}
    </div>
  );
}

function Header() {
  return (
    <header className="h-20 bg-white flex items-center px-6 shadow-md border-b text-black">
      <div className="flex items-center gap-3">
        <MdTranslate className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-wide">Azure Translate</h1>
      </div>
    </header>
  );
}

function Glossary() {
  const [activeTab, setActiveTab] = useState("pair");
  return (
    <div className=" bg-neutral-800 p-4 rounded-lg flex flex-col gap-4 text-white w-full">
      {/* Tab Buttons */}
      <h1 className="text-xl font-bold self-center">Glossary</h1>
      <div className="tab-buttons flex gap-4 border-b border-gray-600">
        <button
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === "pair"
              ? "bg-neutral-900 border-b-2 border-blue-500 font-semibold"
              : "bg-neutral-800 hover:bg-neutral-700",
          )}
          onClick={() => setActiveTab("pair")}
        >
          Pair Word
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === "files"
              ? "bg-neutral-900 border-b-2 border-blue-500 font-semibold"
              : "bg-neutral-800 hover:bg-neutral-700",
          )}
          onClick={() => setActiveTab("files")}
        >
          Input files
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content flex flex-col gap-4">
        {activeTab === "pair" && (
          <div>
            <h2 className="font-semibold text-lg mb-2">Glossary Pairs</h2>
            <ul className="list-disc pl-5">
              <li>Hello → Bonjour</li>
              <li>World → Monde</li>
              <li>Computer → Ordinateur</li>
            </ul>
          </div>
        )}
        {activeTab === "files" && (
          <div>
            <h2 className="font-semibold text-lg mb-2">Upload Glossary File</h2>
            <input
              type="file"
              className="text-black rounded px-2 py-1 border border-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
