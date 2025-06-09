import axios from "axios";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  PlusCircle,
  Trash2,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config"; // Adjust path
// You might use a modal library like react-modal or build a simple one
// For simplicity, using basic confirm for delete

const initialRequirementState = {
  mainTopicEng: "",
  mainTopicKhmer: "",
  mainTopicChinese: "",
  no: "",
  pointTitleEng: "",
  pointTitleKhmer: "",
  pointTitleChinese: "",
  pointDescriptionEng: "",
  pointDescriptionKhmer: "",
  pointDescriptionChinese: "",
  levelValue: 3, // Default level
  mustHave: false
};

const AuditCheckPoints = () => {
  const { t, i18n } = useTranslation([
    "auditTable",
    "qmsAudit",
    "fabricAudit",
    "common"
  ]); // Add namespaces
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state for adding/editing checkpoint SECTIONS
  const [isSectionFormVisible, setIsSectionFormVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(null); // null for new, object for edit
  const [sectionFormData, setSectionFormData] = useState({
    mainTitle: "",
    mainTitleNo: "",
    sectionTitleEng: "",
    sectionTitleKhmer: "",
    sectionTitleChinese: ""
  });

  // Form state for adding/editing REQUIREMENTS
  const [editingRequirement, setEditingRequirement] = useState(null); // { checkpointId, requirement } or null
  const [requirementFormData, setRequirementFormData] = useState(
    initialRequirementState
  );

  // For dropdowns
  const [uniqueSectionTitles, setUniqueSectionTitles] = useState({
    eng: [],
    khmer: [],
    chinese: []
  });
  const [uniqueMainTopics, setUniqueMainTopics] = useState({
    eng: [],
    khmer: [],
    chinese: []
  });

  const [expandedSections, setExpandedSections] = useState({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/audit-checkpoints`);
      setCheckpoints(response.data);
      // Fetch unique titles/topics for dropdowns
      const titlesRes = await axios.get(
        `${API_BASE_URL}/api/audit-checkpoints/unique-section-titles`
      );
      setUniqueSectionTitles(titlesRes.data);
      const topicsRes = await axios.get(
        `${API_BASE_URL}/api/audit-checkpoints/unique-main-topics`
      );
      setUniqueMainTopics(topicsRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch audit checkpoints"
      );
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (checkpointId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [checkpointId]: !prev[checkpointId]
    }));
  };

  // --- Section Form Handlers ---
  const handleSectionInputChange = (e) => {
    const { name, value } = e.target;
    setSectionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenNewSectionForm = () => {
    setCurrentSection(null);
    setSectionFormData({
      mainTitle: "",
      mainTitleNo: "",
      sectionTitleEng: "",
      sectionTitleKhmer: "",
      sectionTitleChinese: ""
    });
    setIsSectionFormVisible(true);
  };

  const handleEditSection = (section) => {
    setCurrentSection(section);
    setSectionFormData({
      mainTitle: section.mainTitle,
      mainTitleNo: section.mainTitleNo,
      sectionTitleEng: section.sectionTitleEng,
      sectionTitleKhmer: section.sectionTitleKhmer,
      sectionTitleChinese: section.sectionTitleChinese
    });
    setIsSectionFormVisible(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (currentSection) {
        // Update
        await axios.put(
          `${API_BASE_URL}/api/audit-checkpoints/${currentSection._id}`,
          sectionFormData
        );
      } else {
        // Create
        await axios.post(
          `${API_BASE_URL}/api/audit-checkpoints`,
          sectionFormData
        );
      }
      setIsSectionFormVisible(false);
      fetchData(); // Refresh
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (
      window.confirm(
        t(
          "common.confirmDeleteSection",
          "Are you sure you want to delete this entire section and all its requirements?"
        )
      )
    ) {
      setIsLoading(true);
      try {
        await axios.delete(
          `${API_BASE_URL}/api/audit-checkpoints/${sectionId}`
        );
        fetchData(); // Refresh
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete section");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- Requirement Form Handlers ---
  const handleRequirementInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRequirementFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value)
          : value
    }));
  };

  const handleOpenNewRequirementForm = (checkpointId) => {
    setEditingRequirement({ checkpointId, requirement: null }); // No existing requirement
    setRequirementFormData(initialRequirementState);
  };

  const handleEditRequirement = (checkpointId, requirement) => {
    setEditingRequirement({ checkpointId, requirement });
    setRequirementFormData({ ...requirement }); // Populate form with existing data
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    if (!editingRequirement?.checkpointId) return;
    setIsLoading(true);
    try {
      if (
        editingRequirement.requirement &&
        editingRequirement.requirement._id
      ) {
        // Update existing requirement
        await axios.put(
          `${API_BASE_URL}/api/audit-checkpoints/${editingRequirement.checkpointId}/requirements/${editingRequirement.requirement._id}`,
          requirementFormData
        );
      } else {
        // Add new requirement
        await axios.post(
          `${API_BASE_URL}/api/audit-checkpoints/${editingRequirement.checkpointId}/requirements`,
          requirementFormData
        );
      }
      setEditingRequirement(null); // Close form
      fetchData(); // Refresh
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save requirement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequirement = async (checkpointId, requirementId) => {
    if (
      window.confirm(
        t(
          "common.confirmDeleteRequirement",
          "Are you sure you want to delete this requirement?"
        )
      )
    ) {
      setIsLoading(true);
      try {
        await axios.delete(
          `${API_BASE_URL}/api/audit-checkpoints/${checkpointId}/requirements/${requirementId}`
        );
        fetchData(); // Refresh
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete requirement");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper for datalist options
  const renderDatalistOptions = (optionsArray) =>
    optionsArray.map((opt, i) => <option key={i} value={opt} />);

  if (isLoading && checkpoints.length === 0)
    return (
      <div className="p-4 text-center">{t("common.loading", "Loading...")}</div>
    );
  if (error && checkpoints.length === 0)
    return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        {t("auditCheckPoints.manageTitle", "Manage Audit Checkpoints")}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleOpenNewSectionForm}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
      >
        <PlusCircle size={18} className="mr-2" />{" "}
        {t("auditCheckPoints.addNewSection", "Add New Audit Section")}
      </button>

      {/* Section Add/Edit Form (Modal or inline) */}
      {isSectionFormVisible && (
        <form
          onSubmit={handleSaveSection}
          className="mb-6 p-4 border rounded-md bg-white shadow-sm"
        >
          <h3 className="text-lg font-medium mb-3">
            {currentSection
              ? t("auditCheckPoints.editSection", "Edit Section")
              : t("auditCheckPoints.addNewSection", "Add New Section")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="mainTitle"
              value={sectionFormData.mainTitle}
              onChange={handleSectionInputChange}
              placeholder={t(
                "auditCheckPoints.mainTitlePlaceholder",
                "Main Title (e.g., QMS)"
              )}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              name="mainTitleNo"
              value={sectionFormData.mainTitleNo}
              onChange={handleSectionInputChange}
              placeholder={t(
                "auditCheckPoints.mainTitleNoPlaceholder",
                "No. (e.g., 1)"
              )}
              className="p-2 border rounded"
              required
            />

            <input
              list="sectionTitlesEng"
              type="text"
              name="sectionTitleEng"
              value={sectionFormData.sectionTitleEng}
              onChange={handleSectionInputChange}
              placeholder={t(
                "auditCheckPoints.sectionTitleEngPlaceholder",
                "Section Title (English)"
              )}
              className="p-2 border rounded"
              required
            />
            <datalist id="sectionTitlesEng">
              {renderDatalistOptions(uniqueSectionTitles.eng)}
            </datalist>

            <input
              list="sectionTitlesKhmer"
              type="text"
              name="sectionTitleKhmer"
              value={sectionFormData.sectionTitleKhmer}
              onChange={handleSectionInputChange}
              placeholder={t(
                "auditCheckPoints.sectionTitleKhmerPlaceholder",
                "Section Title (Khmer)"
              )}
              className="p-2 border rounded"
              required
            />
            <datalist id="sectionTitlesKhmer">
              {renderDatalistOptions(uniqueSectionTitles.khmer)}
            </datalist>

            <input
              list="sectionTitlesChinese"
              type="text"
              name="sectionTitleChinese"
              value={sectionFormData.sectionTitleChinese}
              onChange={handleSectionInputChange}
              placeholder={t(
                "auditCheckPoints.sectionTitleChinesePlaceholder",
                "Section Title (Chinese)"
              )}
              className="p-2 border rounded"
              required
            />
            <datalist id="sectionTitlesChinese">
              {renderDatalistOptions(uniqueSectionTitles.chinese)}
            </datalist>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {isLoading
                ? t("common.saving", "Saving...")
                : t("common.save", "Save")}
            </button>
            <button
              type="button"
              onClick={() => setIsSectionFormVisible(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </form>
      )}

      {/* List of Checkpoint Sections */}
      <div className="space-y-4">
        {checkpoints.map((cp) => (
          <div key={cp._id} className="border rounded-lg bg-white shadow-sm">
            <div
              className="flex justify-between items-center p-3 border-b cursor-pointer hover:bg-slate-50"
              onClick={() => toggleSection(cp._id)}
            >
              <h3 className="text-md font-semibold text-indigo-700">
                {cp.mainTitleNo}. {cp.mainTitle} - (
                {i18n.language === "km"
                  ? cp.sectionTitleKhmer
                  : i18n.language === "zh"
                  ? cp.sectionTitleChinese
                  : cp.sectionTitleEng}
                )
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSection(cp);
                  }}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  title={t("common.edit", "Edit Section")}
                >
                  {" "}
                  <Edit2 size={16} />{" "}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(cp._id);
                  }}
                  className="p-1 text-red-500 hover:text-red-700"
                  title={t("common.delete", "Delete Section")}
                >
                  {" "}
                  <Trash2 size={16} />{" "}
                </button>
                {expandedSections[cp._id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {expandedSections[cp._id] && (
              <div className="p-3">
                <button
                  onClick={() => handleOpenNewRequirementForm(cp._id)}
                  className="mb-3 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center"
                >
                  <PlusCircle size={14} className="mr-1" />{" "}
                  {t("auditCheckPoints.addRequirement", "Add Requirement")}
                </button>

                {/* Requirement Add/Edit Form (could be a modal) */}
                {editingRequirement &&
                  editingRequirement.checkpointId === cp._id && (
                    <form
                      onSubmit={handleSaveRequirement}
                      className="my-3 p-3 border rounded-md bg-slate-50 text-xs"
                    >
                      <h4 className="font-medium mb-2">
                        {editingRequirement.requirement
                          ? t(
                              "auditCheckPoints.editRequirement",
                              "Edit Requirement"
                            )
                          : t(
                              "auditCheckPoints.addRequirement",
                              "Add Requirement"
                            )}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                        <input
                          list="mainTopicsEng"
                          type="text"
                          name="mainTopicEng"
                          value={requirementFormData.mainTopicEng}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.mainTopicEngPlaceholder",
                            "Main Topic Eng"
                          )}
                          className="p-1.5 border rounded"
                        />
                        <datalist id="mainTopicsEng">
                          {renderDatalistOptions(uniqueMainTopics.eng)}
                        </datalist>

                        <input
                          list="mainTopicsKhmer"
                          type="text"
                          name="mainTopicKhmer"
                          value={requirementFormData.mainTopicKhmer}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.mainTopicKhmerPlaceholder",
                            "Main Topic Khmer"
                          )}
                          className="p-1.5 border rounded"
                        />
                        <datalist id="mainTopicsKhmer">
                          {renderDatalistOptions(uniqueMainTopics.khmer)}
                        </datalist>

                        <input
                          list="mainTopicsChinese"
                          type="text"
                          name="mainTopicChinese"
                          value={requirementFormData.mainTopicChinese}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.mainTopicChinesePlaceholder",
                            "Main Topic Chinese"
                          )}
                          className="p-1.5 border rounded"
                        />
                        <datalist id="mainTopicsChinese">
                          {renderDatalistOptions(uniqueMainTopics.chinese)}
                        </datalist>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                        <input
                          type="text"
                          name="no"
                          value={requirementFormData.no}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.requirementNoPlaceholder",
                            "No."
                          )}
                          className="p-1.5 border rounded"
                        />
                        <input
                          type="number"
                          name="levelValue"
                          value={requirementFormData.levelValue}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.levelPlaceholder",
                            "Level (1-4)"
                          )}
                          min="1"
                          max="4"
                          className="p-1.5 border rounded"
                        />
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="mustHave"
                            checked={requirementFormData.mustHave}
                            onChange={handleRequirementInputChange}
                            className="h-4 w-4"
                          />{" "}
                          {t("auditTable.mustHave", "Must Have")}
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                        <input
                          type="text"
                          name="pointTitleEng"
                          value={requirementFormData.pointTitleEng}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.pointTitleEngPlaceholder",
                            "Point Title Eng"
                          )}
                          className="p-1.5 border rounded"
                        />
                        <input
                          type="text"
                          name="pointTitleKhmer"
                          value={requirementFormData.pointTitleKhmer}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.pointTitleKhmerPlaceholder",
                            "Point Title Khmer"
                          )}
                          className="p-1.5 border rounded"
                        />
                        <input
                          type="text"
                          name="pointTitleChinese"
                          value={requirementFormData.pointTitleChinese}
                          onChange={handleRequirementInputChange}
                          placeholder={t(
                            "auditCheckPoints.pointTitleChinesePlaceholder",
                            "Point Title Chinese"
                          )}
                          className="p-1.5 border rounded"
                        />
                      </div>
                      <textarea
                        name="pointDescriptionEng"
                        value={requirementFormData.pointDescriptionEng}
                        onChange={handleRequirementInputChange}
                        placeholder={t(
                          "auditCheckPoints.pointDescEngPlaceholder",
                          "Description Eng"
                        )}
                        rows="2"
                        className="w-full p-1.5 border rounded mb-1"
                      ></textarea>
                      <textarea
                        name="pointDescriptionKhmer"
                        value={requirementFormData.pointDescriptionKhmer}
                        onChange={handleRequirementInputChange}
                        placeholder={t(
                          "auditCheckPoints.pointDescKhmerPlaceholder",
                          "Description Khmer"
                        )}
                        rows="2"
                        className="w-full p-1.5 border rounded mb-1"
                      ></textarea>
                      <textarea
                        name="pointDescriptionChinese"
                        value={requirementFormData.pointDescriptionChinese}
                        onChange={handleRequirementInputChange}
                        placeholder={t(
                          "auditCheckPoints.pointDescChinesePlaceholder",
                          "Description Chinese"
                        )}
                        rows="2"
                        className="w-full p-1.5 border rounded mb-2"
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-300"
                        >
                          {isLoading
                            ? t("common.saving", "Saving...")
                            : t("common.save", "Save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRequirement(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                        >
                          {t("common.cancel", "Cancel")}
                        </button>
                      </div>
                    </form>
                  )}

                {/* Requirements Table */}
                {cp.requirements && cp.requirements.length > 0 ? (
                  <div className="overflow-x-auto text-xs">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border p-1.5">
                            {t("auditTable.no", "No.")}
                          </th>
                          <th className="border p-1.5">
                            {t("auditTable.mainTopic", "Main Topic")}
                          </th>
                          <th className="border p-1.5">
                            {t("auditTable.points", "Point Title")}
                          </th>
                          {/* <th className="border p-1.5">Description</th> */}
                          <th className="border p-1.5">
                            {t("auditTable.level", "Level")}
                          </th>
                          <th className="border p-1.5">
                            {t("auditTable.mustHave", "Must Have")}
                          </th>
                          <th className="border p-1.5">
                            {t("common.actions", "Actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cp.requirements.map((req) => (
                          <tr key={req._id || req.no}>
                            <td className="border p-1.5">{req.no}</td>
                            <td className="border p-1.5">
                              {i18n.language === "km"
                                ? req.mainTopicKhmer
                                : i18n.language === "zh"
                                ? req.mainTopicChinese
                                : req.mainTopicEng}
                            </td>
                            <td className="border p-1.5">
                              {i18n.language === "km"
                                ? req.pointTitleKhmer
                                : i18n.language === "zh"
                                ? req.pointTitleChinese
                                : req.pointTitleEng}
                            </td>
                            {/* <td className="border p-1.5">{i18n.language === 'km' ? req.pointDescriptionKhmer : (i18n.language === 'zh' ? req.pointDescriptionChinese : req.pointDescriptionEng)}</td> */}
                            <td className="border p-1.5 text-center">
                              {req.levelValue}
                            </td>
                            <td className="border p-1.5 text-center">
                              {req.mustHave ? (
                                <CheckCircle
                                  size={14}
                                  className="text-green-500 mx-auto"
                                />
                              ) : (
                                <XCircle
                                  size={14}
                                  className="text-red-500 mx-auto"
                                />
                              )}
                            </td>
                            <td className="border p-1.5 text-center">
                              <button
                                onClick={() =>
                                  handleEditRequirement(cp._id, req)
                                }
                                className="p-1 text-blue-500 hover:text-blue-700 mr-1"
                                title={t("common.edit", "Edit")}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteRequirement(cp._id, req._id)
                                }
                                className="p-1 text-red-500 hover:text-red-700"
                                title={t("common.delete", "Delete")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    {t(
                      "auditCheckPoints.noRequirements",
                      "No requirements added for this section yet."
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditCheckPoints;
