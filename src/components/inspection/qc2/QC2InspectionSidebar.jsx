import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Menu,
  Filter,
  Tag,
  ArrowUpDown,
  Printer,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import BluetoothComponent from "../../forms/Bluetooth";
import { API_BASE_URL } from "../../../../config";

const QC2InspectionSidebar = ({
  defectTypeFilter,
  setDefectTypeFilter,
  categoryFilter,
  setCategoryFilter,
  sortOption,
  setSortOption,
  bluetoothRef,
  isBluetoothConnected
}) => {
  const { t } = useTranslation();
  const currentLanguage = i18next.language;
  const [navOpen, setNavOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [menuClicked, setMenuClicked] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const defectTypes = ["all", "common", "type1", "type2"];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-defect-categories`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories.");
        }
        const data = await response.json();
        setCategoryOptions(data);
        setCategoriesError(null);
      } catch (err) {
        setCategoriesError(err.message);
        setCategoryOptions([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleMenuClick = () => {
    setNavOpen(!navOpen);
    setMenuClicked(true);
  };

  const handleIconClick = (feature) => {
    setSelectedFeature(feature);
    setMenuClicked(false);
    setNavOpen(true);
  };

  const CategoryFilterUI = () => (
    <>
      <div className="flex items-center mt-4 mb-1">
        <Tag className="w-5 h-5 mr-1" />
        <span className="font-medium">{t("ana.category")}</span>
      </div>
      {categoriesLoading && (
        <Loader2 className="w-5 h-5 animate-spin mx-auto my-2" />
      )}
      {categoriesError && (
        <AlertCircle
          className="w-5 h-5 text-red-500 mx-auto my-2"
          title={categoriesError}
        />
      )}
      {!categoriesLoading && !categoriesError && (
        <div className="grid grid-cols-2 gap-1">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(
                  cat.toLowerCase() === categoryFilter ? "" : cat.toLowerCase()
                );
                setDefectTypeFilter("all");
              }}
              className={`p-1 text-sm rounded border capitalize ${
                categoryFilter === cat.toLowerCase()
                  ? "bg-blue-600"
                  : "bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const ExpandedMenu = () => (
    <>
      {/* Defect Type Filter */}
      <div className="flex items-center mb-1">
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

      {/* Category Filter - Now uses dynamic data */}
      <CategoryFilterUI />

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
            : "Count (High-Low)"}
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
    </>
  );

  const CollapsedMenu = () => (
    <div className="space-y-6">
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
