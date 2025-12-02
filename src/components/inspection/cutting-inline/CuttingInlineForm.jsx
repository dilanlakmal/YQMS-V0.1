import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Ruler, Palette, Package, Clock, Gauge, Activity, Layers, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../../../config.js";

const CuttingInlineForm = ({ orderData = null, onFormDataChange = null }) => {
  const { t, i18n } = useTranslation();
  
  // Helper function to get defect name based on current language
  const getDefectName = (defect) => {
    const currentLang = i18n.language;
    if (currentLang === 'kh') return defect.defectNameKhmer;
    if (currentLang === 'ch') return defect.defectNameChinese;
    return defect.defectName; // default to English
  };
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    cuttingTable: "",
    styleNo: "",
    fabricColorItemArtNo: "",
    lotNo: "",
    relaxingDate: new Date().toISOString().slice(0, 16),
    spreadingSpeedForward: "",
    spreadingSpeedBackward: "",
    spreadingTension: "",
    spreadingQuality: "",
    spreadingQualityDetail: "",
    planLayer: "",
    actualLayer: "",
    markerNo: "",
    markerLength: "",
    markerWidth: "",
    standardRelaxTime: ""
  });

  const [defects, setDefects] = useState({
    T: {},
    M: {},
    B: {}
  });

  const [defectTypes, setDefectTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch defect types from backend
  useEffect(() => {
    const fetchDefectTypes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cutting-inline-defects`);
        const data = await response.json();
        
        if (data.success) {
          setDefectTypes(data.data);
        } else {
          console.error("Failed to fetch defect types:", data.message);
          // Fallback to default defects with temporary IDs
          setDefectTypes([
            { _id: "temp_1", defectName: "Holes", defectNameKhmer: "ធ្លុះ", defectNameChinese: "破洞" },
            { _id: "temp_2", defectName: "Barre Line", defectNameKhmer: "ឆ្នូតសាច់ក្រណាត់", defectNameChinese: "条痕" },
            { _id: "temp_3", defectName: "Color Spot", defectNameKhmer: "ពណ៌ចំណុច", defectNameChinese: "色斑" },
            { _id: "temp_4", defectName: "Color Shading", defectNameKhmer: "ពណ៌មិនដូចគ្នា", defectNameChinese: "色差" },
            { _id: "temp_5", defectName: "Scratches", defectNameKhmer: "ស្នាមខូច", defectNameChinese: "划痕" },
            { _id: "temp_6", defectName: "Stain", defectNameKhmer: "ប្រលាក់", defectNameChinese: "污渍" },
            { _id: "temp_7", defectName: "Other", defectNameKhmer: "ផ្សេងៗ", defectNameChinese: "其他" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching defect types:", error);
        // Fallback to default defects with temporary IDs
        setDefectTypes([
          { _id: "temp_1", defectName: "Holes", defectNameKhmer: "ធ្លុះ", defectNameChinese: "破洞" },
          { _id: "temp_2", defectName: "Barre Line", defectNameKhmer: "ឆ្នូតសាច់ក្រណាត់", defectNameChinese: "条痕" },
          { _id: "temp_3", defectName: "Color Spot", defectNameKhmer: "ពណ៌ចំណុច", defectNameChinese: "色斑" },
          { _id: "temp_4", defectName: "Color Shading", defectNameKhmer: "ពណ៌មិនដូចគ្នា", defectNameChinese: "色差" },
          { _id: "temp_5", defectName: "Scratches", defectNameKhmer: "ស្នាមខូច", defectNameChinese: "划痕" },
          { _id: "temp_6", defectName: "Stain", defectNameKhmer: "ប្រលាក់", defectNameChinese: "污渍" },
          { _id: "temp_7", defectName: "Other", defectNameKhmer: "ផ្សេងៗ", defectNameChinese: "其他" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDefectTypes();
  }, []);

  // Effect to populate form data when orderData changes
  useEffect(() => {
    if (orderData) {
      console.log("Populating form with order data:", orderData);
      
      // Map API response fields to form fields based on user specifications
      const mappedFormData = {
        date: new Date().toISOString().slice(0, 16),
        cuttingTable: orderData.spreadTable?.toString().toUpperCase() || "",
        styleNo: orderData.styleNo || "",
        fabricColorItemArtNo: orderData.color || "",
        lotNo: Array.isArray(orderData.lotNos) ? orderData.lotNos.join(", ") : (orderData.lotNos || ""),
        relaxingDate: new Date().toISOString().slice(0, 16),
        spreadingSpeedForward: "",
        spreadingSpeedBackward: "",
        spreadingTension: "", // Not available in API, user will fill
        spreadingQuality: "",
        spreadingQualityDetail: "",
        planLayer: orderData.planLayer?.toString() || orderData.PlanLayer?.toString() || "",
        actualLayer: orderData.actualLayer?.toString() || orderData.ActualLayer?.toString() || "",
        markerNo: orderData.mackerNo || "",
        markerLength: orderData.mackerLength?.toString() || "",
        markerWidth: orderData.mackerWidth?.toString() || "",
        standardRelaxTime: (
          orderData.standardRelaxTime ?? orderData.StandardRelaxTime ?? 0
        ).toString()
      };
      
      setFormData(mappedFormData);
      
      // Notify parent component of form data change
      if (onFormDataChange) {
        onFormDataChange(mappedFormData);
      }
    }
  }, [orderData]);

  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    
    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(newFormData);
    }
  };

  const handleCuttingTableChange = (value) => {
    // Only allow A-Z (case insensitive), and only 1 letter
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    const singleLetter = sanitized.slice(0, 1);
    handleInputChange('cuttingTable', singleLetter);
  };

  const handleDefectChange = (section, defectId, value) => {
    setDefects(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [defectId]: value
      }
    }));
  };

  const handleClear = () => {
    const clearedFormData = {
      date: new Date().toISOString().slice(0, 16),
      cuttingTable: "",
      styleNo: "",
      fabricColorItemArtNo: "",
      lotNo: "",
      relaxingDate: new Date().toISOString().slice(0, 16),
      spreadingSpeedForward: "",
      spreadingSpeedBackward: "",
      spreadingTension: "",
      spreadingQuality: "",
      spreadingQualityDetail: "",
      planLayer: "",
      actualLayer: "",
      markerNo: "",
      markerLength: "",
      markerWidth: "",
      standardRelaxTime: ""
    };
    
    setFormData(clearedFormData);
    setDefects({
      T: {},
      M: {},
      B: {}
    });
    setErrors({});
    
    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(clearedFormData);
    }
  };

  const validate = () => {
    const nextErrors = {};

    const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';
    const isNum = (v) => v !== '' && !isNaN(v);

    // Required fields (all except defects section)
    if (isEmpty(formData.date)) nextErrors.date = t('validation.required') || 'Required';
    if (isEmpty(formData.cuttingTable)) nextErrors.cuttingTable = t('validation.required') || 'Required';
    if (isEmpty(formData.styleNo)) nextErrors.styleNo = t('validation.required') || 'Required';
    if (isEmpty(formData.fabricColorItemArtNo)) nextErrors.fabricColorItemArtNo = t('validation.required') || 'Required';
    if (isEmpty(formData.lotNo)) nextErrors.lotNo = t('validation.required') || 'Required';
    if (isEmpty(formData.relaxingDate)) nextErrors.relaxingDate = t('validation.required') || 'Required';
    if (isEmpty(formData.spreadingQuality)) nextErrors.spreadingQuality = t('validation.required') || 'Required';
    if (formData.spreadingQuality === 'fail' && isEmpty(formData.spreadingQualityDetail)) {
      nextErrors.spreadingQualityDetail = t('validation.required') || 'Required';
    }

    // Required numeric fields
    if (isEmpty(formData.planLayer) || !isNum(formData.planLayer) || parseInt(formData.planLayer) < 0) {
      nextErrors.planLayer = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }
    if (isEmpty(formData.actualLayer) || !isNum(formData.actualLayer) || parseInt(formData.actualLayer) < 0) {
      nextErrors.actualLayer = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }
    if (isEmpty(formData.markerNo)) nextErrors.markerNo = t('validation.required') || 'Required';
    if (isEmpty(formData.markerLength) || !isNum(formData.markerLength) || parseFloat(formData.markerLength) <= 0) {
      nextErrors.markerLength = t('validation.positiveNumber') || 'Must be a positive number';
    }
    if (isEmpty(formData.markerWidth) || !isNum(formData.markerWidth) || parseFloat(formData.markerWidth) <= 0) {
      nextErrors.markerWidth = t('validation.positiveNumber') || 'Must be a positive number';
    }
    if (isEmpty(formData.standardRelaxTime) || !isNum(formData.standardRelaxTime) || parseInt(formData.standardRelaxTime) < 0) {
      nextErrors.standardRelaxTime = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }

    // Now required numeric for spreading fields (forward/backward)
    if (isEmpty(formData.spreadingSpeedForward) || !isNum(formData.spreadingSpeedForward) || parseFloat(formData.spreadingSpeedForward) < 0) {
      nextErrors.spreadingSpeedForward = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }
    if (isEmpty(formData.spreadingSpeedBackward) || !isNum(formData.spreadingSpeedBackward) || parseFloat(formData.spreadingSpeedBackward) < 0) {
      nextErrors.spreadingSpeedBackward = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }
    if (isEmpty(formData.spreadingTension) || !isNum(formData.spreadingTension) || parseFloat(formData.spreadingTension) < 0) {
      nextErrors.spreadingTension = t('validation.nonNegativeNumber') || 'Must be a non-negative number';
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, nextErrors };
  };

  const handleSave = () => {
    const { isValid, nextErrors } = validate();
    if (!isValid) {
      const firstErr = Object.values(nextErrors)[0];
      alert(firstErr || (t && t('validation.fixErrors')) || 'Please fix validation errors');
      return;
    }
    // Build payload matching report collection
    const grandTotal = Object.values(defects).reduce(
      (total, section) => total + Object.values(section).reduce((sum, val) => sum + (parseInt(val) || 0), 0),
      0
    );

    const toArray = (str) =>
      (str || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const mapSection = (sectionKey) => {
      const entries = defects[sectionKey] || {};
      const items = Object.entries(entries)
        .map(([defectId, qty]) => ({ defectId, qty: parseInt(qty) || 0 }))
        .filter((x) => x.qty > 0)
        .map((x) => {
          const found = defectTypes.find((d) => d._id === x.defectId);
          return {
            defectName: found ? found.defectName : x.defectId,
            Qty: x.qty
          };
        });
      return { Name: sectionKey, defects: items };
    };

    // Compute relaxation result
    const start = formData.date ? new Date(formData.date) : null;
    const end = formData.relaxingDate ? new Date(formData.relaxingDate) : null;
    const diffHours = start && end ? Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60)) : 0;
    const standardHours = parseInt(formData.standardRelaxTime) || 0;
    const isPass = diffHours >= standardHours;
    const lackingHours = isPass ? 0 : Math.max(standardHours - diffHours, 0);

    const payload = {
      inspectionDate: new Date(formData.date).toISOString(),
      MONO: formData.styleNo,
      Color: formData.fabricColorItemArtNo,
      LotNo: toArray(formData.lotNo),
      PlanLayerQty: parseInt(formData.planLayer) || 0,
      ActualLayerQty: parseInt(formData.actualLayer) || 0,
      MackerLength: parseFloat(formData.markerLength) || 0,
      MackerWidth: parseFloat(formData.markerWidth) || 0,
      MackerNo: formData.markerNo,
      RelaxingDate: formData.relaxingDate ? new Date(formData.relaxingDate).toISOString() : null,
      SpreadingSpeedForward: formData.spreadingSpeedForward?.toString() || "",
      SpreadingSpeedBackward: formData.spreadingSpeedBackward?.toString() || "",
      SpreadingTension: formData.spreadingTension?.toString() || "",
      SpreadingQuality: (formData.spreadingQuality || "").toUpperCase(),
      SpreadingQualityDetail: formData.spreadingQuality === 'fail' ? (formData.spreadingQualityDetail || '') : '',
      StandardRelaxTime: parseInt(formData.standardRelaxTime) || 0,
      ResultRelaxation: isPass ? 'PASS' : 'FAIL',
      RelaxationLackingHours: lackingHours,
      TotalDefectQty: grandTotal,
      FabricDefectsData: [mapSection("T"), mapSection("M"), mapSection("B")]
    };

    fetch(`${API_BASE_URL}/api/cutting-inline-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to save report");
        return data;
      })
      .then(() => {
        alert(t('cuttingInline.saveSuccess') || 'Saved successfully');
      })
      .catch((err) => {
        console.error('Save report error:', err);
        alert((t && t('cuttingInline.saveFailed')) || `Save failed: ${err.message}`);
      });
  };

  const sections = [
    { id: "T", labelKey: "top", color: "blue" },
    { id: "M", labelKey: "middle", color: "green" },
    { id: "B", labelKey: "bottom", color: "orange" }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
      green: "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700",
      orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
    };
    return colors[color] || colors.blue;
  };

  const getHeaderColorClass = (color) => {
    const colors = {
      blue: "bg-blue-500 dark:bg-blue-600",
      green: "bg-green-500 dark:bg-green-600",
      orange: "bg-orange-500 dark:bg-orange-600"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full">
      {/* Form Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
        {t('cuttingInline.title')}
      </h2>

      {/* Order Data Indicator */}
      {orderData && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-green-600 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                Form populated from barcode scan
              </h3>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                Style: {orderData.styleNo} | Buyer: {orderData.buyer} | Color: {orderData.color}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Barcode Indicator */}
      {!orderData && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-yellow-600 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Please scan barcode to unlock form fields
              </h3>
              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                Only Standard Relax Time can be edited without barcode data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Date */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
            {t('cuttingInline.date')}
          </label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-colors ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
          />
          {errors.date && (<span className="text-xs text-red-500 mt-1">{errors.date}</span>)}
        </div>

        {/* Cutting Table */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Package className="mr-2 h-4 w-4 text-blue-500" />
            {t('cuttingInline.cuttingTable')}
          </label>
          <input
            type="text"
            value={formData.cuttingTable}
            onChange={(e) => handleCuttingTableChange(e.target.value)}
            placeholder={t('cuttingInline.enterTableLetter')}
            maxLength={1}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.cuttingTable ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {formData.cuttingTable && !/^[A-Z]$/.test(formData.cuttingTable) && (
            <span className="text-xs text-red-500 mt-1">{t('cuttingInline.mustBeSingleLetter')}</span>
          )}
          {errors.cuttingTable && (<span className="text-xs text-red-500 mt-1">{errors.cuttingTable}</span>)}
        </div>

        {/* Style No. */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Activity className="mr-2 h-4 w-4 text-purple-500" />
            {t('cuttingInline.styleNo')}
          </label>
          <input
            type="text"
            value={formData.styleNo}
            onChange={(e) => handleInputChange('styleNo', e.target.value)}
            placeholder={t('cuttingInline.enterStyleNumber')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.styleNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.styleNo && (<span className="text-xs text-red-500 mt-1">{errors.styleNo}</span>)}
        </div>

        {/* Fabric Color/Item/Art No. */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Palette className="mr-2 h-4 w-4 text-pink-500" />
            {t('cuttingInline.fabricColorItemArtNo')}
          </label>
          <input
            type="text"
            value={formData.fabricColorItemArtNo}
            onChange={(e) => handleInputChange('fabricColorItemArtNo', e.target.value)}
            placeholder={t('cuttingInline.enterFabricDetails')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.fabricColorItemArtNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.fabricColorItemArtNo && (<span className="text-xs text-red-500 mt-1">{errors.fabricColorItemArtNo}</span>)}
        </div>

        {/* Lot No. */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Package className="mr-2 h-4 w-4 text-green-500" />
            {t('cuttingInline.lotNo')}
          </label>
          <input
            type="text"
            value={formData.lotNo}
            onChange={(e) => handleInputChange('lotNo', e.target.value)}
            placeholder={t('cuttingInline.enterLotNumber')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.lotNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.lotNo && (<span className="text-xs text-red-500 mt-1">{errors.lotNo}</span>)}
        </div>

        {/* Relaxing Date */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="mr-2 h-4 w-4 text-orange-500" />
            {t('cuttingInline.relaxingDate')}
          </label>
          <input
            type="datetime-local"
            value={formData.relaxingDate}
            onChange={(e) => handleInputChange('relaxingDate', e.target.value)}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.relaxingDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
          />
          {errors.relaxingDate && (<span className="text-xs text-red-500 mt-1">{errors.relaxingDate}</span>)}
        </div>

        {/* Spreading Speed Forward */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Gauge className="mr-2 h-4 w-4 text-red-500" />
            {t('cuttingInline.spreadingSpeed')} - Forward
          </label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={formData.spreadingSpeedForward}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              handleInputChange('spreadingSpeedForward', val);
            }}
            placeholder={t('cuttingInline.enterSpreadingSpeed')}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.spreadingSpeedForward ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
            autoComplete="off"
          />
          {errors.spreadingSpeedForward && (<span className="text-xs text-red-500 mt-1">{errors.spreadingSpeedForward}</span>)}
        </div>

        {/* Spreading Speed Backward */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Gauge className="mr-2 h-4 w-4 text-red-500" />
            {t('cuttingInline.spreadingSpeed')} - Backward
          </label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={formData.spreadingSpeedBackward}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              handleInputChange('spreadingSpeedBackward', val);
            }}
            placeholder={t('cuttingInline.enterSpreadingSpeed')}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.spreadingSpeedBackward ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
            autoComplete="off"
          />
          {errors.spreadingSpeedBackward && (<span className="text-xs text-red-500 mt-1">{errors.spreadingSpeedBackward}</span>)}
        </div>

        {/* Spreading Tension */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Activity className="mr-2 h-4 w-4 text-teal-500" />
            {t('cuttingInline.spreadingTension')}
          </label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={formData.spreadingTension}
            onChange={(e) => {
              // Only allow numbers and optional decimal point
              const val = e.target.value.replace(/[^0-9.]/g, '');
              handleInputChange('spreadingTension', val);
            }}
            placeholder={t('cuttingInline.enterSpreadingTension')}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.spreadingTension ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
            autoComplete="off"
          />
          {errors.spreadingTension && (<span className="text-xs text-red-500 mt-1">{errors.spreadingTension}</span>)}
        </div>

        {/* Spreading Quality */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Activity className="mr-2 h-4 w-4 text-cyan-500" />
            {t('cuttingInline.spreadingQuality')}
          </label>
          <select
            value={formData.spreadingQuality}
            onChange={(e) => handleInputChange('spreadingQuality', e.target.value)}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.spreadingQuality ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
          >
            <option value="">{t('cuttingInline.selectQuality')}</option>
            <option value="pass">{t('cuttingInline.pass')}</option>
            <option value="fail">{t('cuttingInline.fail')}</option>
          </select>
          {errors.spreadingQuality && (<span className="text-xs text-red-500 mt-1">{errors.spreadingQuality}</span>)}
          {formData.spreadingQuality === 'fail' && (
            <div className="mt-2">
              <select
                value={formData.spreadingQualityDetail}
                onChange={(e) => handleInputChange('spreadingQualityDetail', e.target.value)}
                className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.spreadingQualityDetail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
              >
                <option value="">{t('cuttingInline.selectFailReason') || 'Select Fail Reason'}</option>
                <option value="Loose">{t('cuttingInline.failLoose') || 'Loose'}</option>
                <option value="Tight">{t('cuttingInline.failTight') || 'Tight'}</option>
              </select>
              {errors.spreadingQualityDetail && (<span className="text-xs text-red-500 mt-1">{errors.spreadingQualityDetail}</span>)}
            </div>
          )}
        </div>

        {/* Plan Layer */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Layers className="mr-2 h-4 w-4 text-yellow-500" />
            {t('cuttingInline.planLayer')}
          </label>
          <input
            type="number"
            value={formData.planLayer}
            onChange={(e) => handleInputChange('planLayer', e.target.value)}
            placeholder={t('cuttingInline.enterPlanLayer')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.planLayer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.planLayer && (<span className="text-xs text-red-500 mt-1">{errors.planLayer}</span>)}
        </div>

        {/* Actual Layer */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Layers className="mr-2 h-4 w-4 text-orange-500" />
            {t('cuttingInline.actualLayer')}
          </label>
          <input
            type="number"
            value={formData.actualLayer}
            onChange={(e) => handleInputChange('actualLayer', e.target.value)}
            placeholder={t('cuttingInline.enterActualLayer')}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors ${errors.actualLayer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.actualLayer && (<span className="text-xs text-red-500 mt-1">{errors.actualLayer}</span>)}
        </div>

        {/* Marker No */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Package className="mr-2 h-4 w-4 text-violet-500" />
            {t('cuttingInline.markerNo')}
          </label>
          <input
            type="text"
            value={formData.markerNo}
            onChange={(e) => handleInputChange('markerNo', e.target.value)}
            placeholder={t('cuttingInline.enterMarkerNo')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.markerNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.markerNo && (<span className="text-xs text-red-500 mt-1">{errors.markerNo}</span>)}
        </div>
        {/* Marker Length */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Ruler className="mr-2 h-4 w-4 text-emerald-500" />
            {t('cuttingInline.markerLength')}
          </label>
          <input
            type="text"
            value={formData.markerLength}
            onChange={(e) => handleInputChange('markerLength', e.target.value)}
            placeholder={t('cuttingInline.enterMarkerLength')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.markerLength ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.markerLength && (<span className="text-xs text-red-500 mt-1">{errors.markerLength}</span>)}
        </div>

        {/* Marker Width */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Ruler className="mr-2 h-4 w-4 text-sky-500" />
            {t('cuttingInline.markerWidth')}
          </label>
          <input
            type="text"
            value={formData.markerWidth}
            onChange={(e) => handleInputChange('markerWidth', e.target.value)}
            placeholder={t('cuttingInline.enterMarkerWidth')}
            disabled={true}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white focus:outline-none transition-colors bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75 ${errors.markerWidth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.markerWidth && (<span className="text-xs text-red-500 mt-1">{errors.markerWidth}</span>)}
        </div>


        {/* Standard Relax Time */}
        <div className="flex flex-col">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            {t('cuttingInline.standardRelaxTime')}
          </label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.standardRelaxTime}
            onChange={(e) => {
              // Only allow numbers
              const val = e.target.value.replace(/[^0-9]/g, '');
              handleInputChange('standardRelaxTime', val);
            }}
            placeholder={t('cuttingInline.enterRelaxTime')}
            className={`px-4 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none transition-colors ${errors.standardRelaxTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'}`}
          />
          {errors.standardRelaxTime && (<span className="text-xs text-red-500 mt-1">{errors.standardRelaxTime}</span>)}
        </div>
      </div>

      {/* Marker Ratio Table - Below Form */}
      {orderData && orderData.markerRatio && (
        <div className="mt-8 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Layers className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Marker Ratio
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Size</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {orderData.markerRatio
                    .filter(item => item.ratio > 0) // Filter ratio > 0
                    .sort((a, b) => {
                      // Sort by size - handle special cases
                      const sizeOrder = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
                      const aIndex = sizeOrder.indexOf(a.size);
                      const bIndex = sizeOrder.indexOf(b.size);
                      
                      // If both sizes are in the predefined order, use that
                      if (aIndex !== -1 && bIndex !== -1) {
                        return aIndex - bIndex;
                      }
                      // If only one is in predefined order, prioritize it
                      if (aIndex !== -1) return -1;
                      if (bIndex !== -1) return 1;
                      // If neither is in predefined order, sort alphabetically
                      return a.size.localeCompare(b.size);
                    })
                    .map((item, index) => (
                      <tr 
                        key={`${item.no}-${item.size}`} 
                        className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                          {item.size}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center font-semibold">
                          {item.ratio}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fabric Defects Section */}
      <div className="mt-8">
        <div className="flex items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
          <AlertCircle className="mr-2 h-6 w-6 text-red-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('cuttingInline.fabricDefects')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`border-2 rounded-lg p-3 md:p-4 ${getColorClass(section.color)}`}
            >
              {/* Section Header */}
              <div className={`${getHeaderColorClass(section.color)} text-white px-3 md:px-4 py-2 md:py-3 rounded-md mb-3 md:mb-4 text-center`}>
                <h3 className="text-lg md:text-xl font-bold">
                  {section.id}
                </h3>
                <p className="text-xs md:text-sm mt-1 break-words">
                  {t(`cuttingInline.${section.labelKey}`)}
                </p>
              </div>

              {/* Defect Inputs */}
              <div className="space-y-3">
                {loading ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">{t('cuttingInline.loadingDefects')}</p>
                ) : (
                  defectTypes.map((defect) => (
                    <div key={defect._id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:flex-1 sm:min-w-0">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 break-words line-clamp-2">
                          {getDefectName(defect)}
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={defects[section.id][defect._id] || ""}
                        onChange={(e) => handleDefectChange(section.id, defect._id, e.target.value)}
                        placeholder="0"
                        className="w-full sm:w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-center font-semibold"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Section Total */}
              <div className="mt-3 md:mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 break-words">
                    {t('cuttingInline.total')}:
                  </span>
                  <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-3 md:px-4 py-1 md:py-2 rounded-md flex-shrink-0">
                    {Object.values(defects[section.id]).reduce((sum, val) => sum + (parseInt(val) || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t('cuttingInline.grandTotal')}:
            </span>
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {Object.values(defects).reduce(
                (total, section) => 
                  total + Object.values(section).reduce((sum, val) => sum + (parseInt(val) || 0), 0),
                0
              )}
            </span>
          </div>
        </div>

        {/* Defect Legend */}
        {/* <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-bold text-gray-900 dark:text-white mb-3">
            {t('cuttingInline.defectTypes')}:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-700 dark:text-gray-300">
            {defectTypes.map((defect, index) => (
              <div key={defect._id}>
                <span className="font-semibold">{index + 1}.</span> {getDefectName(defect)}
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {/* <button
          type="button"
          onClick={handleClear}
          className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-semibold"
        >
          {t('cuttingInline.clear')}
        </button> */}
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md font-semibold"
        >
          {t('cuttingInline.save')}
        </button>
      </div>
    </div>
  );
};

export default CuttingInlineForm;

