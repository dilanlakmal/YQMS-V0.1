import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../authentication/AuthContext"; // Adjusted path

const FACTORY_NAMES = ["YM", "Elite", "Sunicon"]; // For Factory dropdown
const LANGUAGE_OPTIONS = [
  // For Key Languages spoken
  { key: "english", labelKey: "puov.languages.english" },
  { key: "chinese", labelKey: "puov.languages.chinese" },
  { key: "khmer", labelKey: "puov.languages.khmer" },
  { key: "philippines", labelKey: "puov.languages.philippines" },
  { key: "thai", labelKey: "puov.languages.thai" },
  { key: "hindi", labelKey: "puov.languages.hindi" },
  { key: "tamil", labelKey: "puov.languages.tamil" },
  { key: "sinhala", labelKey: "puov.languages.sinhala" },
  { key: "others", labelKey: "puov.languages.others" }
];
const TRANSPORT_MODES = [
  { key: "local", labelKey: "puov.transportModeOptions.local" },
  { key: "sea", labelKey: "puov.transportModeOptions.sea" },
  { key: "air", labelKey: "puov.transportModeOptions.air" }
];

const PUOV = () => {
  const { t } = useTranslation();
  const { user } = useAuth(); // Get user from AuthContext

  const initialSpecificCategories = Array(3).fill({
    category: "",
    capabilities: ""
  });

  const [formData, setFormData] = useState({
    factoryName: "YM", // Default factory
    dateOfAudit: null,
    auditor: "", // Will be set from user
    lastAuditDate: null,
    newPuToYorkmars: "", // User input
    productionStartDate: null,
    dateFactoryBuilt: null, // User input
    noOfFloorsIncludingGround: "", // Number input
    noOfBuildingsAtSite: "", // Number input
    averageMonthlyOutputPcs: "", // Number input
    totalM2ProductionArea: "", // Number input
    averageOperatorsPerLine: "", // Number input
    numberOfProductionLines: "", // Number input
    productTypes: {
      mens: false,
      ladies: false,
      childrens: false,
      babies: false,
      apparel: false,
      accessory: false,
      shoes: false
    },
    specificCategoriesList: initialSpecificCategories,
    specificCategoriesRowCount: 3,
    contacts: {
      // Structure for Production Unit Contacts
      ownerGeneralManager: { name: "", email: "", telephone: "" },
      merchandiseManager: { name: "", email: "", telephone: "" },
      qualityManager: { name: "", email: "", telephone: "" },
      productionManager: { name: "", email: "", telephone: "" }
    },
    employeeCounts: {
      // Structure for Number of Employees
      managementSupervisors: "",
      sampleMakingRoom: "",
      cuttingRoom: "",
      numberOfDirectWorkers: "",
      finishingAndPacking: "",
      qualityDepartment: ""
    },
    keyLanguages: LANGUAGE_OPTIONS.reduce(
      (acc, lang) => ({ ...acc, [lang.key]: false }),
      {}
    ),
    otherLanguageSpecify: "",
    transportFromYM: {
      days: "",
      hours: "",
      modes: TRANSPORT_MODES.reduce(
        (acc, mode) => ({ ...acc, [mode.key]: false }),
        {}
      )
    },
    annualLabourTurnover: "",
    internalProcesses: {
      // Default to 'No'
      spinning: "No",
      knittingCircular: "No",
      knittingFlatKnit: "No",
      weaving: "No",
      dyingFabric: "No",
      dyingGarments: "No",
      washingGarments: "No",
      allOverPrinting: "No",
      placementPrinting: "No",
      testingLaboratory: "No",
      sampleRoom: "No",
      cuttingRoomFacility: "No",
      sewingRoom: "No",
      pressing: "No",
      packing: "No",
      warehouse: "No"
    }
  });

  // Set auditor name from logged-in user
  useEffect(() => {
    if (user?.eng_name) {
      setFormData((prev) => ({ ...prev, auditor: user.eng_name }));
    }
  }, [user]);

  // Calculate Total Number of Workers
  const totalNumberOfWorkers = useMemo(() => {
    return Object.values(formData.employeeCounts).reduce((sum, count) => {
      const num = parseInt(count, 10);
      return sum + (isNaN(num) || num < 0 ? 0 : num);
    }, 0);
  }, [formData.employeeCounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, ...fieldParts] = name.split(".");
    const field = fieldParts.join(".");

    if (
      section === "productTypes" ||
      section === "keyLanguages" ||
      (section === "transportFromYM" && field === "modes")
    ) {
      const subSectionKey =
        section === "transportFromYM" ? fieldParts[0] : field; // 'modes' or language key
      const itemKey = section === "transportFromYM" ? fieldParts[1] : field;

      if (section === "transportFromYM" && subSectionKey === "modes") {
        setFormData((prev) => ({
          ...prev,
          transportFromYM: {
            ...prev.transportFromYM,
            modes: { ...prev.transportFromYM.modes, [itemKey]: checked }
          }
        }));
      } else {
        // productTypes or keyLanguages
        setFormData((prev) => ({
          ...prev,
          [section]: { ...prev[section], [itemKey]: checked }
        }));
      }
    } else if (section === "contacts") {
      const [contactType, contactField] = field.split("_"); // e.g., ownerGeneralManager_name
      setFormData((prev) => ({
        ...prev,
        contacts: {
          ...prev.contacts,
          [contactType]: {
            ...prev.contacts[contactType],
            [contactField]: value
          }
        }
      }));
    } else if (section === "employeeCounts") {
      const numValue = value === "" ? "" : Math.max(0, parseInt(value, 10)); // Allow empty or positive int
      setFormData((prev) => ({
        ...prev,
        employeeCounts: {
          ...prev.employeeCounts,
          [field]:
            isNaN(numValue) && value !== ""
              ? prev.employeeCounts[field]
              : String(numValue)
        }
      }));
    } else if (section === "internalProcesses") {
      setFormData((prev) => ({
        ...prev,
        internalProcesses: { ...prev.internalProcesses, [field]: value }
      }));
    } else if (section === "transportFromYM") {
      // For days, hours
      setFormData((prev) => ({
        ...prev,
        transportFromYM: { ...prev.transportFromYM, [field]: value }
      }));
    } else if (name === "annualLabourTurnover") {
      // Allow numbers and a single decimal point
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleSpecificCategoriesChange = (index, colName, value) => {
    const newList = [...formData.specificCategoriesList];
    newList[index] = { ...newList[index], [colName]: value };
    setFormData((prev) => ({ ...prev, specificCategoriesList: newList }));
  };

  const handleSpecificCategoriesRowCountChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    setFormData((prev) => {
      const currentList = prev.specificCategoriesList;
      const newList = Array(newCount)
        .fill(null)
        .map((_, i) => currentList[i] || { category: "", capabilities: "" });
      return {
        ...prev,
        specificCategoriesRowCount: newCount,
        specificCategoriesList: newList
      };
    });
  };

  const renderYesNoRadio = (processNameKey) => (
    <div className="flex gap-4 items-center">
      <label className="font-normal flex items-center text-sm">
        <input
          type="radio"
          name={`internalProcesses.${processNameKey}`}
          value="Yes"
          checked={formData.internalProcesses[processNameKey] === "Yes"}
          onChange={handleChange}
          className="mr-1.5"
        />{" "}
        {t("puov.yes")}
      </label>
      <label className="font-normal flex items-center text-sm">
        <input
          type="radio"
          name={`internalProcesses.${processNameKey}`}
          value="No"
          checked={formData.internalProcesses[processNameKey] === "No"}
          onChange={handleChange}
          className="mr-1.5"
        />{" "}
        {t("puov.no")}
      </label>
    </div>
  );

  const inputClasses =
    "p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500";
  const numberInputClasses = `${inputClasses} text-right`;
  const labelClasses = "block mb-1 font-semibold text-sm text-gray-700";
  const sectionClasses =
    "mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow"; // Use white for sections inside gray page
  const sectionTitleClasses =
    "text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4";

  return (
    // Removed max-w and mx-auto to allow parent to control width
    <div className="p-6 font-sans">
      {" "}
      {/* Minimal padding, parent should handle more */}
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        {t("puov.formTitle")}
      </h2>
      <h3 className="text-base text-gray-600 mb-6">{t("puov.subTitle")}</h3>
      {/* General Information Section */}
      <div className={sectionClasses}>
        <div className="grid md:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="factoryName" className={labelClasses}>
              {t("puov.factoryName")}
            </label>
            <select
              id="factoryName"
              name="factoryName"
              value={formData.factoryName}
              onChange={handleChange}
              className={inputClasses}
            >
              {FACTORY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dateOfAudit" className={labelClasses}>
              {t("puov.dateOfAudit")}
            </label>
            <input
              type="date"
              id="dateOfAudit"
              name="dateOfAudit"
              value={formData.dateOfAudit || ""}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="auditor" className={labelClasses}>
              {t("puov.auditor")}
            </label>
            <input
              type="text"
              id="auditor"
              name="auditor"
              value={formData.auditor}
              readOnly
              className={`${inputClasses} bg-gray-100`}
            />
          </div>
          <div>
            <label htmlFor="lastAuditDate" className={labelClasses}>
              {t("puov.lastAuditDate")}
            </label>
            <input
              type="date"
              id="lastAuditDate"
              name="lastAuditDate"
              value={formData.lastAuditDate || ""}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="newPuToYorkmars" className={labelClasses}>
              {t("puov.newPuToYorkmars")}
            </label>
            <input
              type="text"
              id="newPuToYorkmars"
              name="newPuToYorkmars"
              value={formData.newPuToYorkmars}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="productionStartDate" className={labelClasses}>
              {t("puov.productionStartDate")}
            </label>
            <input
              type="date"
              id="productionStartDate"
              name="productionStartDate"
              value={formData.productionStartDate || ""}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="dateFactoryBuilt" className={labelClasses}>
              {t("puov.dateFactoryBuilt")}
            </label>
            <input
              type="date"
              id="dateFactoryBuilt"
              name="dateFactoryBuilt"
              value={formData.dateFactoryBuilt || ""}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="noOfFloorsIncludingGround" className={labelClasses}>
              {t("puov.noOfFloorsIncludingGround")}
            </label>
            <div className="flex items-center">
              <input
                type="number"
                inputMode="numeric"
                id="noOfFloorsIncludingGround"
                name="noOfFloorsIncludingGround"
                value={formData.noOfFloorsIncludingGround}
                onChange={handleChange}
                className={`${numberInputClasses} w-20`}
                min="0"
              />
              <span className="ml-2 text-sm text-gray-600">
                {t("puov.floorUnit")}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="noOfBuildingsAtSite" className={labelClasses}>
              {t("puov.noOfBuildingsAtSite")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="noOfBuildingsAtSite"
              name="noOfBuildingsAtSite"
              value={formData.noOfBuildingsAtSite}
              onChange={handleChange}
              className={numberInputClasses}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="averageMonthlyOutputPcs" className={labelClasses}>
              {t("puov.averageMonthlyOutputPcs")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="averageMonthlyOutputPcs"
              name="averageMonthlyOutputPcs"
              value={formData.averageMonthlyOutputPcs}
              onChange={handleChange}
              className={numberInputClasses}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="totalM2ProductionArea" className={labelClasses}>
              {t("puov.totalM2ProductionArea")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="totalM2ProductionArea"
              name="totalM2ProductionArea"
              value={formData.totalM2ProductionArea}
              onChange={handleChange}
              className={numberInputClasses}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="averageOperatorsPerLine" className={labelClasses}>
              {t("puov.averageOperatorsPerLine")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="averageOperatorsPerLine"
              name="averageOperatorsPerLine"
              value={formData.averageOperatorsPerLine}
              onChange={handleChange}
              className={numberInputClasses}
              min="0"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="numberOfProductionLines" className={labelClasses}>
              {t("puov.numberOfProductionLines")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="numberOfProductionLines"
              name="numberOfProductionLines"
              value={formData.numberOfProductionLines}
              onChange={handleChange}
              className={numberInputClasses}
              min="0"
            />
          </div>
        </div>
      </div>
      {/* PU Product Type Section */}
      <div className={sectionClasses}>
        <h4 className={sectionTitleClasses}>{t("puov.puProductType")}</h4>
        <div className="grid md:grid-cols-3 gap-x-6 gap-y-2 mb-4">
          {[
            "mens",
            "ladies",
            "childrens",
            "babies",
            "apparel",
            "accessory",
            "shoes"
          ].map((type) => (
            <label key={type} className="flex items-center text-sm">
              <input
                type="checkbox"
                name={`productTypes.${type}`}
                checked={formData.productTypes[type]}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              {t(`puov.${type}`)}
            </label>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelClasses}>
              {t("puov.listSpecificPUCategories")}
            </label>
            <div className="flex items-center">
              <span className="text-sm mr-2">{t("puov.rows")}:</span>
              <select
                value={formData.specificCategoriesRowCount}
                onChange={handleSpecificCategoriesRowCountChange}
                className="p-1 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">
                    {t("puov.puCategory")}
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    {t("puov.productCapabilitiesRemarks")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.specificCategoriesList.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.category}
                        onChange={(e) =>
                          handleSpecificCategoriesChange(
                            index,
                            "category",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.capabilities}
                        onChange={(e) =>
                          handleSpecificCategoriesChange(
                            index,
                            "capabilities",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border-gray-200 rounded text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Production Unit Contacts Section */}
      <div className={sectionClasses}>
        <h4 className={sectionTitleClasses}>
          {t("puov.productionUnitContacts")}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse mt-2 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">
                  {t("puov.contactPerson")}
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  {t("puov.name")}
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  {t("puov.email")}
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  {t("puov.telephone")}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(formData.contacts).map(
                (
                  contactKey // Changed from contactType to contactKey for clarity
                ) => (
                  <tr key={contactKey} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">
                      {t(`puov.${contactKey}`)}
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        name={`contacts.${contactKey}_name`}
                        value={formData.contacts[contactKey].name}
                        onChange={handleChange}
                        className="w-full p-1 border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="email"
                        name={`contacts.${contactKey}_email`}
                        value={formData.contacts[contactKey].email}
                        onChange={handleChange}
                        className="w-full p-1 border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="tel"
                        name={`contacts.${contactKey}_telephone`}
                        value={formData.contacts[contactKey].telephone}
                        onChange={handleChange}
                        className="w-full p-1 border-gray-200 rounded text-sm"
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Number of Employees Section */}
      <div className={sectionClasses}>
        <h4 className={sectionTitleClasses}>{t("puov.numberOfEmployees")}</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left w-3/5">
                  {t("puov.employeeType")}
                </th>
                <th className="border border-gray-300 p-2 text-left w-2/5">
                  {t("puov.employeeCount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(formData.employeeCounts).map((empKey) => (
                <tr key={empKey}>
                  <td className="border border-gray-300 p-2">
                    {t(`puov.${empKey}`)}
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      name={`employeeCounts.${empKey}`}
                      value={formData.employeeCounts[empKey]}
                      onChange={handleChange}
                      className={`${numberInputClasses} w-full`}
                      min="0"
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="border border-gray-300 p-2">
                  {t("puov.totalNumberOfWorkers")}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {totalNumberOfWorkers}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Languages, Transport, Turnover Section */}
      <div className={sectionClasses}>
        <div className="grid md:grid-cols-1 gap-y-6">
          <div>
            <label className={labelClasses}>
              {t("puov.keyLanguagesSpoken")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <label key={lang.key} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name={`keyLanguages.${lang.key}`}
                    checked={formData.keyLanguages[lang.key]}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  {t(lang.labelKey)}
                </label>
              ))}
            </div>
            {formData.keyLanguages.others && (
              <div className="mt-2">
                <label
                  htmlFor="otherLanguageSpecify"
                  className={`${labelClasses} text-xs`}
                >
                  {t("puov.languages.specify")}:
                </label>
                <input
                  type="text"
                  id="otherLanguageSpecify"
                  name="otherLanguageSpecify"
                  value={formData.otherLanguageSpecify}
                  onChange={handleChange}
                  className={`${inputClasses} mt-0.5`}
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClasses}>
              {t("puov.timeAndModeOfTransport")}
            </label>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 mt-1">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("puov.transportTime")}:
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    name="transportFromYM.days"
                    value={formData.transportFromYM.days}
                    onChange={handleChange}
                    className={`${numberInputClasses} w-20`}
                    placeholder={t("puov.days")}
                    min="0"
                  />
                  <span className="text-sm text-gray-500">
                    {t("puov.days")}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="transportFromYM.hours"
                    value={formData.transportFromYM.hours}
                    onChange={handleChange}
                    className={`${numberInputClasses} w-20`}
                    placeholder={t("puov.hours")}
                    min="0"
                    max="23"
                  />
                  <span className="text-sm text-gray-500">
                    {t("puov.hours")}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("puov.transportMode")}:
                </span>
                <div className="space-y-1 mt-1">
                  {TRANSPORT_MODES.map((mode) => (
                    <label key={mode.key} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        name={`transportFromYM.modes.${mode.key}`}
                        checked={formData.transportFromYM.modes[mode.key]}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      {t(mode.labelKey)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="annualLabourTurnover" className={labelClasses}>
              {t("puov.annualLabourTurnoverPercentage")}
            </label>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="decimal"
                id="annualLabourTurnover"
                name="annualLabourTurnover"
                value={formData.annualLabourTurnover}
                onChange={handleChange}
                className={`${numberInputClasses} w-24`}
              />
              <span className="ml-2 text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>
      </div>
      {/* Internal Processes Section */}
      <div className={sectionClasses}>
        <h4 className={sectionTitleClasses}>{t("puov.internalProcesses")}</h4>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {[
            "spinning",
            "placementPrinting",
            "knittingCircular",
            "testingLaboratory",
            "knittingFlatKnit",
            "sampleRoom",
            "weaving",
            "cuttingRoomFacility",
            "dyingFabric",
            "sewingRoom",
            "dyingGarments",
            "pressing",
            "washingGarments",
            "packing",
            "allOverPrinting",
            "warehouse"
          ].map((procKey) => (
            <div
              key={procKey}
              className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-b-0 md:even:border-b-0 md:pb-1.5"
            >
              {" "}
              {/* Complex border handling for 2 cols */}
              <label className="text-sm text-gray-700">
                {t(`puov.${procKey}`)}
              </label>
              {renderYesNoRadio(procKey)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PUOV;
