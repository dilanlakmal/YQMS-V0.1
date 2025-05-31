import React from "react";
import { useTranslation } from "react-i18next";

function LineNoInput({
  formData,
  setFormData,
  isMobileDevice,
  setNumberPadTarget,
  setShowNumberPad,
  mobileInputClass,
  laptopReadOnlyInputClass,
  forMobile
}) {
  const { t } = useTranslation();

  // Handle input change for Line No
  const handleLineNoChange = (e) => {
    const { value } = e.target;
    
    // For Production department, only allow numbers
    if (formData.department === "Production") {
      // Only allow numeric input
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, lineNo: value }));
      }
    } 
    // For Sub-con, convert to uppercase
    else if (formData.department === "Sub-con") {
      const upperValue = value.toUpperCase();
      setFormData((prev) => ({ ...prev, lineNo: upperValue }));
    } 
    // For other departments, normal handling
    else {
      setFormData((prev) => ({ ...prev, lineNo: value }));
    }
  };

  return (
    <div>
      <label
        className={`block font-medium text-gray-700 mb-1 ${
          forMobile ? "text-xs" : "text-sm mb-1.5"
        }`}
      >
        {t("bundle.line_no")}
      </label>
      <div className="relative">
        {isMobileDevice ? (
          formData.department === "Production" ? (
            <input
              type="number"
              name="lineNo"
              value={formData.lineNo}
              onChange={handleLineNoChange}
              className={mobileInputClass}
              placeholder="1-30"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          ) : formData.department === "Sub-con" ? (
            <input
              type="text"
              name="lineNo"
              value={formData.lineNo}
              onChange={handleLineNoChange}
              className={mobileInputClass}
              autoCapitalize="characters"
            />
          ) : (
            <input
              type="text"
              name="lineNo"
              value={formData.lineNo}
              onChange={handleLineNoChange}
              className={mobileInputClass}
              readOnly={formData.department === "Washing" && formData.lineNo === "WA"}
            />
          )
        ) : (
          <input
            type="text"
            value={formData.lineNo}
            onClick={() => {
              setNumberPadTarget("lineNo");
              setShowNumberPad(true);
            }}
            readOnly
            className={`${
              forMobile ? mobileInputClass : laptopReadOnlyInputClass
            } cursor-pointer bg-slate-100`}
            placeholder={formData.department === "Production" ? "1-30" : ""}
          />
        )}
        {formData.department === "Washing" && formData.lineNo === "WA" && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm">WA</span>
          </div>
        )}
        {formData.department === "Sub-con" && formData.lineNo === "SUB" && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm">SUB</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LineNoInput;