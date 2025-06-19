//---This component manages the entire collapsible sidebar, including language selection, filters, sorting, and printer controls.---//

import React, { useState } from "react";
import {
  ArrowLeft,
  Menu,
  Languages,
  Filter,
  Tag,
  ArrowUpDown,
  Printer,
  Paperclip
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import BluetoothComponent from "../../forms/Bluetooth";

const QC2InspectionSidebar = ({
  language,
  handleLanguageChange,
  defectTypeFilter,
  setDefectTypeFilter,
  categoryFilter,
  setCategoryFilter,
  sortOption,
  setSortOption,
  printMethod,
  setPrintMethod,
  bluetoothRef,
  isBluetoothConnected
}) => {
  const { t } = useTranslation();
  const currentLanguage = i18next.language;
  const [navOpen, setNavOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [menuClicked, setMenuClicked] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const categoryOptions = [
    "fabric",
    "workmanship",
    "cleanliness",
    "embellishment",
    "measurement",
    "washing",
    "finishing",
    "miscellaneous"
  ];
  const defectTypes = ["all", "common", "type1", "type2"];

  const handleMenuClick = () => {
    setNavOpen(!navOpen);
    setMenuClicked(true);
  };

  const handleIconClick = (feature) => {
    setSelectedFeature(feature);
    setMenuClicked(false);
    setNavOpen(true);
  };

  const ExpandedMenu = () => (
    <>
      {/* Languages Section */}
      <div className="flex items-center mb-1">
        <Languages className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("qc2In.language")}</span>
      </div>
      <select
        value={language}
        onChange={handleLanguageChange}
        className="w-full p-1 text-black rounded"
      >
        <option value="english">{t("languages.en")}</option>
        <option value="khmer">{t("languages.kh")}</option>
        <option value="chinese">{t("languages.ch")}</option>
        <option value="all">{t("qc2In.all_languages")}</option>
      </select>

      {/* Defect Type Filter */}
      <div className="flex items-center mt-4 mb-1">
        <Filter className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("preview.defect_type")}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {defectTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setDefectTypeFilter(type);
              setCategoryFilter("");
            }}
            className={`p-1 text-sm rounded border ${
              defectTypeFilter === type && !categoryFilter
                ? "bg-blue-600"
                : "bg-gray-700"
            }`}
          >
            {currentLanguage === "en"
              ? t(`qc2In.${type}`).toUpperCase()
              : t(`qc2In.${type}`)}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex items-center mt-4 mb-1">
        <Tag className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("ana.category")}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategoryFilter(cat === categoryFilter ? "" : cat);
              setDefectTypeFilter("all");
            }}
            className={`p-1 text-sm rounded border ${
              categoryFilter === cat ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {currentLanguage === "en"
              ? t(`qc2In.${cat}`).toUpperCase()
              : t(`qc2In.${cat}`)}
          </button>
        ))}
      </div>

      {/* Sort Section */}
      <div className="flex items-center mt-4 mb-1">
        <ArrowUpDown className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("qc2In.sort")}</span>
      </div>
      <div className="relative">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="w-full p-1 rounded bg-gray-700 text-left text-sm"
        >
          {sortOption === "alphaAsc"
            ? "A-Z"
            : sortOption === "alphaDesc"
            ? "Z-A"
            : sortOption === "countDesc"
            ? "Count (High-Low)"
            : "Select Sort"}
        </button>
        {sortDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white text-black rounded shadow p-2">
            <button
              onClick={() => {
                setSortOption("alphaAsc");
                setSortDropdownOpen(false);
              }}
              className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
            >
              A-Z
            </button>
            <button
              onClick={() => {
                setSortOption("alphaDesc");
                setSortDropdownOpen(false);
              }}
              className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
            >
              Z-A
            </button>
            <button
              onClick={() => {
                setSortOption("countDesc");
                setSortDropdownOpen(false);
              }}
              className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
            >
              Count (High-Low)
            </button>
          </div>
        )}
      </div>

      {/* Printer Section */}
      <div className="flex items-center mt-4 mb-1">
        <Printer className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("qc2In.printer")}</span>
      </div>
      <BluetoothComponent ref={bluetoothRef} />

      {/* Printing Method Section */}
      <div className="flex items-center mt-4 mb-1">
        <Paperclip className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("qc2In.printing_method")}</span>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => setPrintMethod("repair")}
          className={`flex-1 p-1 text-sm rounded border ${
            printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {t("qc2In.repair")}
        </button>
        <button
          onClick={() => setPrintMethod("garment")}
          className={`flex-1 p-1 text-sm rounded border ${
            printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {t("qc2In.garment")}
        </button>
        <button
          onClick={() => setPrintMethod("bundle")}
          className={`flex-1 p-1 text-sm rounded border ${
            printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {t("qc2In.bundle")}
        </button>
      </div>
    </>
  );

  const CollapsedMenu = () => (
    <div className="space-y-6">
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("language")}
      >
        <Languages className="w-5 h-5" />
      </button>
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("defectType")}
      >
        <Filter className="w-5 h-5" />
      </button>
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("category")}
      >
        <Tag className="w-5 h-5" />
      </button>
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("sort")}
      >
        <ArrowUpDown className="w-5 h-5" />
      </button>
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("printer")}
      >
        <Printer
          className={`w-5 h-5 ${isBluetoothConnected ? "text-green-500" : ""}`}
        />
      </button>
      <button
        className="flex justify-center w-full"
        onClick={() => handleIconClick("printingMethod")}
      >
        <Paperclip className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div
      className={`${
        navOpen ? "w-72" : "w-16"
      } bg-gray-800 text-white h-screen p-2 transition-all duration-300 overflow-y-auto`}
    >
      <div className="flex items-center justify-center mb-6">
        <button onClick={handleMenuClick} className="p-2 focus:outline-none">
          {navOpen ? <ArrowLeft /> : <Menu />}
        </button>
      </div>
      {navOpen ? (
        <div className="space-y-4">
          <ExpandedMenu />
        </div>
      ) : (
        <CollapsedMenu />
      )}
    </div>
  );
};

export default QC2InspectionSidebar;
