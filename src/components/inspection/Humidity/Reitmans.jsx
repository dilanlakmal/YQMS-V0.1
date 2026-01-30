import React from "react";
import { API_BASE_URL } from "../../../../config";
import {
  Package,
  Calendar,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Clock,
  MapPin,
  Mail,
  Phone,
  Check,
  X,
  UploadCloud,
  Layers,
  Activity,
  Info,
} from "lucide-react";

const ReitmansForm = ({
  formData,
  setFormData,
  updateSectionData,
  handleImageUpload,
  removeImage,
  removeRecord,
  addRecord,
  errors,
  checkHistory = [],
  onBack,
  onNewInspection,
  handleSubmit,
  ribsAvailable,
  setPassFail,
  // Added suggestion props
  orderNoSearch,
  setOrderNoSearch,
  orderNoSuggestions,
  showOrderNoDropdown,
  setShowOrderNoDropdown,
  isLoadingOrderData,
  handleOrderNoSelect,
  availableColors = [],
}) => {
  // Lightweight helpers to avoid errors if props missing
  const safeSet = (key, value) =>
    setFormData && setFormData((prev) => ({ ...prev, [key]: value }));
  const dropdownRef = React.useRef(null);
  const [primaryFabric, setPrimaryFabric] = React.useState(null);
  const [secondaryFabric, setSecondaryFabric] = React.useState(null);
  const [fabricLoading, setFabricLoading] = React.useState(false);
  const [rhRaw, setRhRaw] = React.useState(null);

  const setCurrentTimeIfEmpty = (field) => {
    if (!formData[field]) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      safeSet(field, `${hh}:${mm}`);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOrderNoDropdown && setShowOrderNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowOrderNoDropdown]);

  // fetch primary/secondary fabric info when a factory style is selected
  React.useEffect(() => {
    let mounted = true;
    const fetchFabrics = async (moNo) => {
      try {
        setFabricLoading(true);
        const base =
          API_BASE_URL && API_BASE_URL !== ""
            ? API_BASE_URL.replace(/\/$/, "")
            : "";
        const url = `${base}/api/humidity-data/${encodeURIComponent(moNo)}/summary`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const json = await res.json();
        const fabrics =
          json && json.data && json.data.fabrics ? json.data.fabrics : [];
        const orderInfo = json && json.data ? json.data : {};

        if (!mounted) return;
        setPrimaryFabric(fabrics[0] || null);
        setSecondaryFabric(fabrics[1] || null);

        // Update basic form data from orderInfo
        if (setFormData) {
          setFormData((prev) => ({
            ...prev,
            fabrication: orderInfo.product || prev.fabrication,
            poLine: orderInfo.purchaseOrder || orderInfo.poLine || prev.poLine,
            colorName: orderInfo.colorName || prev.colorName,
          }));
        }

        // Try to fetch reitmans_humidity doc for this style to prefer its primary/secondary
        try {
          const rhUrl = `${base}/api/reitmans-humidity/${encodeURIComponent(moNo)}`;
          const rhRes = await fetch(rhUrl);
          if (rhRes && rhRes.ok) {
            const rhJson = await rhRes.json();
            const rhData = rhJson && rhJson.data ? rhJson.data : null;
            if (rhData) {
              const docObj = rhData.doc || rhData;
              const pName = rhData.primary || docObj.primary || "";
              const pPctActual = rhData.primaryPercent || "";
              const sName = rhData.secondary || docObj.secondary || "";
              const sPctActual = sName ? rhData.secondaryPercent || "" : "";

              if (pName)
                setPrimaryFabric({ fabricName: pName, percentage: pPctActual });
              if (sName)
                setSecondaryFabric({
                  fabricName: sName,
                  percentage: sPctActual,
                });

              if (setFormData) {
                setFormData((prev) => ({
                  ...prev,
                  primaryFabric: pName || prev.primaryFabric,
                  primaryPercentage: pPctActual || prev.primaryPercentage,
                  secondaryFabric: sName || prev.secondaryFabric,
                  secondaryPercentage: sPctActual || prev.secondaryPercentage,
                  colorName:
                    rhData.colorName || docObj.colorName || prev.colorName,
                  composition: `${pName}${pPctActual ? " " + pPctActual + "%" : ""}${sName ? " , " + sName + (sPctActual ? " " + sPctActual + "%" : "") : ""}`,
                  // Use the calculating value from the backend (docObj.upperCentisimalIndex)
                  upperCentisimalIndex:
                    rhData.value ||
                    docObj.upperCentisimalIndex ||
                    docObj.value ||
                    prev.upperCentisimalIndex,
                  aquaboySpec:
                    rhData.value ||
                    docObj.upperCentisimalIndex ||
                    docObj.value ||
                    docObj.aquaboySpec ||
                    docObj.spec ||
                    prev.aquaboySpec,
                  matchedRule: docObj.matchedRule || null, // Store matched rule info for range display
                  timeChecked: docObj.timeChecked || prev.timeChecked,
                  moistureRateBeforeDehumidify:
                    docObj.moistureRateBeforeDehumidify ||
                    docObj.moistureRateBefore ||
                    prev.moistureRateBeforeDehumidify,
                  noPcChecked: docObj.noPcChecked || prev.noPcChecked,
                  timeIn: docObj.timeIn || prev.timeIn,
                  timeOut: docObj.timeOut || prev.timeOut,
                  moistureRateAfter:
                    docObj.moistureRateAfter || prev.moistureRateAfter,
                }));
              }
            }
          }
        } catch (rhErr) { }
      } catch (err) {
        console.warn("Could not fetch fabric summary for Reitmans style:", err);
        if (mounted) {
          setPrimaryFabric(null);
          setSecondaryFabric(null);
        }
      } finally {
        if (mounted) setFabricLoading(false);
      }
    };

    const mo =
      formData && (formData.factoryStyleNo || formData.moNo || formData.style);
    if (mo) fetchFabrics(mo);
    else {
      setPrimaryFabric(null);
      setSecondaryFabric(null);
    }

    return () => {
      mounted = false;
    };
  }, [formData.factoryStyleNo]);

  const fetchRhRaw = async (moNo) => {
    if (!moNo) return;
    try {
      const base =
        API_BASE_URL && API_BASE_URL !== ""
          ? API_BASE_URL.replace(/\/$/, "")
          : "";
      const rhRes = await fetch(
        `${base}/api/reitmans-humidity/${encodeURIComponent(moNo)}`,
      );
      if (!rhRes.ok) {
        setRhRaw({ error: `No reitmans_humidity record (${rhRes.status})` });
        return;
      }
      const rhJson = await rhRes.json();
      setRhRaw(rhJson && rhJson.data ? rhJson.data : rhJson || null);
    } catch (e) {
      setRhRaw({ error: e.message || String(e) });
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto p-6 bg-white">
      {/* Beige header like the mock */}
      <div className="rounded-lg bg-white p-6 shadow-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Redesigned Fabric Summary Section */}
          <div className="md:col-span-3 mt-4">
            {fabricLoading ? (
              <div className="flex items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-rose-100 animate-pulse">
                <div className="w-5 h-5 bg-rose-200 rounded-full"></div>
                <div className="text-sm font-medium text-rose-400">
                  Analyzing fabric composition...
                </div>
              </div>
            ) : primaryFabric || secondaryFabric ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Fabric Card */}
                <div className="group bg-gradient-to-br from-white to-rose-50/30 backdrop-blur-md p-4 rounded-2xl border border-rose-300/50 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300 flex items-center gap-4">
                  <div className="p-3 bg-rose-100 rounded-xl text-rose-600 group-hover:scale-110 transition-transform duration-300">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">
                      Primary Fabric
                    </div>
                    <div className="text-sm font-bold text-gray-800 flex items-baseline gap-1.5 leading-tight">
                      {primaryFabric
                        ? primaryFabric.fabricName ||
                        primaryFabric.name ||
                        primaryFabric.fabricName
                        : "N/A"}
                      {primaryFabric && (
                        <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">
                          {formData.matchedRule &&
                            (formData.matchedRule["primary%"] ||
                              formData.matchedRule.primaryPercent)
                            ? formData.matchedRule["primary%"] ||
                            formData.matchedRule.primaryPercent
                            : primaryFabric.percentage ||
                              primaryFabric.percentage === 0
                              ? primaryFabric.percentage + "%"
                              : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Secondary Fabric Card */}
                <div className="group bg-gradient-to-br from-white to-rose-50/30 backdrop-blur-md p-4 rounded-2xl border border-rose-300/50 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300 flex items-center gap-4">
                  <div className="p-3 bg-rose-100 rounded-xl text-rose-600 group-hover:scale-110 transition-transform duration-300">
                    <Layers size={20} className="opacity-70" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">
                      Secondary Fabric
                    </div>
                    <div className="text-sm font-bold text-gray-800 flex items-baseline gap-1.5 leading-tight">
                      {secondaryFabric
                        ? secondaryFabric.fabricName ||
                        secondaryFabric.name ||
                        secondaryFabric.fabricName
                        : "N/A"}
                      {secondaryFabric && (
                        <span className="text-xs bg-rose-300 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                          {formData.matchedRule &&
                            (formData.matchedRule["secondary%"] ||
                              formData.matchedRule.secondaryPercent)
                            ? formData.matchedRule["secondary%"] ||
                            formData.matchedRule.secondaryPercent
                            : secondaryFabric.percentage ||
                              secondaryFabric.percentage === 0
                              ? secondaryFabric.percentage + "%"
                              : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upper Centisimal Index Card */}
                <div className="group bg-gradient-to-br from-white to-rose-50/30 backdrop-blur-md p-4 rounded-2xl border border-rose-300/50 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300 flex items-center gap-4">
                  <div className="p-3 bg-rose-100 rounded-xl text-rose-600 group-hover:scale-110 transition-transform duration-300">
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">
                      Upper Centisimal Index
                    </div>
                    <div className="text-lg font-black text-gray-800 leading-tight">
                      {formData.upperCentisimalIndex !== undefined &&
                        formData.upperCentisimalIndex !== null &&
                        formData.upperCentisimalIndex !== "" &&
                        String(formData.upperCentisimalIndex) !== "0"
                        ? formData.upperCentisimalIndex
                        : formData.aquaboySpec &&
                          String(formData.aquaboySpec) !== "0"
                          ? formData.aquaboySpec
                          : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Style #
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                value={formData.factoryStyleNo || orderNoSearch || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderNoSearch && setOrderNoSearch(val);
                  setFormData &&
                    setFormData((prev) => ({ ...prev, factoryStyleNo: val }));
                }}
                onFocus={() => {
                  if (orderNoSuggestions && orderNoSuggestions.length > 0) {
                    setShowOrderNoDropdown && setShowOrderNoDropdown(true);
                  }
                }}
                className={`w-full rounded-lg border px-4 py-2 bg-white outline-none transition-all ${errors?.factoryStyleNo ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Search style..."
              />

              {showOrderNoDropdown && (
                <ul className="absolute z-[100] left-0 right-0 mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isLoadingOrderData ? (
                    <li className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                      Searching styles...
                    </li>
                  ) : orderNoSuggestions?.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-500 italic text-center">
                      No matching styles found
                    </li>
                  ) : (
                    orderNoSuggestions?.map((ord, idx) => (
                      <li
                        key={ord._id || idx}
                        onClick={() => {
                          handleOrderNoSelect &&
                            handleOrderNoSelect(ord.moNo || ord.style || "");
                          setShowOrderNoDropdown &&
                            setShowOrderNoDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-rose-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
                              {ord.moNo || ord.style}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 font-medium italic">
                              {ord.buyer}
                            </div>
                          </div>
                          <div className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                            {ord.product || "Standard"}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            {errors?.factoryStyleNo && (
              <p className="text-red-500 text-[11px] mt-1 font-bold italic">
                {errors.factoryStyleNo}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Composition:
            </label>
            <input
              value={formData?.composition || ""}
              onChange={(e) => safeSet("composition", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 cursor-not-allowed"
              placeholder=""
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Color Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            {availableColors.length > 0 ? (
              <div className="relative">
                <select
                  value={formData.colorName}
                  onChange={(e) => {
                    const color = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      colorName: color,
                      inspectionRecords: prev.inspectionRecords.map(
                        (record) => ({
                          ...record,
                          colorName: color,
                        }),
                      ),
                    }));
                  }}
                  className={`w-full px-4 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none ${errors.colorName ? "border-red-500" : "border-gray-300"
                    }`}
                  required
                  aria-required="true"
                  disabled={!formData.factoryStyleNo}
                  style={{ backgroundPosition: "right 0.75rem center" }}
                >
                  <option value="" disabled>
                    Select Color
                  </option>
                  {availableColors.map((color, idx) => (
                    <option key={idx} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                {/* Chevron-down icon absolute right, less forward/less protruding */}
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pl-2">
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={formData.colorName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    colorName: e.target.value,
                  }))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.colorName ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder=""
                required
                aria-required="true"
                disabled={!formData.factoryStyleNo}
              />
            )}
            {errors.colorName && (
              <p className="text-red-500 text-sm mt-1">{errors.colorName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              PO #
            </label>
            <input
              value={formData?.poLine || ""}
              onChange={(e) => safeSet("poLine", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 cursor-not-allowed"
              placeholder=""
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time Checked:
            </label>
            <input
              type="time"
              value={formData?.timeChecked || ""}
              onChange={(e) => safeSet("timeChecked", e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty("timeChecked")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Moisture rate before:
            </label>
            <input
              value={formData?.moistureRateBeforeDehumidify || ""}
              onChange={(e) =>
                safeSet("moistureRateBeforeDehumidify", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              No. pc checked:
            </label>
            <input
              value={formData?.noPcChecked || ""}
              onChange={(e) => safeSet("noPcChecked", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time in:
            </label>
            <input
              type="time"
              value={formData?.timeIn || ""}
              onChange={(e) => safeSet("timeIn", e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty("timeIn")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time out:
            </label>
            <input
              type="time"
              value={formData?.timeOut || ""}
              onChange={(e) => safeSet("timeOut", e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty("timeOut")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Moisture rate after:
            </label>
            <input
              value={formData?.moistureRateAfter || ""}
              onChange={(e) => safeSet("moistureRateAfter", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Upper Centisimal index:
            </label>
            <input
              value={formData?.upperCentisimalIndex || ""}
              onChange={(e) => safeSet("upperCentisimalIndex", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 cursor-not-allowed"
              placeholder=""
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Date:
            </label>
            <input
              type="date"
              value={formData?.date || ""}
              onChange={(e) => safeSet("date", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
        </div>

        <div className="mt-6 bg-rose-50 p-6 rounded-xl shadow-inner border border-rose-100">
          <h3 className="text-2xl font-bold text-rose-700 mb-4 flex items-center gap-2">
            <Users className="text-rose-700" size={18} />
            Inspection Records
          </h3>
          <div className="flex flex-col items-center gap-6">
            {formData.inspectionRecords.map((record, index) => (
              <div
                key={index}
                className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-100"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[5rem] -mr-8 -mt-8 opacity-40 group-hover:bg-rose-100 transition-colors duration-500"></div>

                <div className="relative flex flex-col lg:flex-row gap-8">
                  {/* Left: Metadata & Section Controls */}
                  <div className="lg:w-1/3 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white font-black text-sm ring-4 ring-rose-50">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-black text-gray-800 tracking-tight">
                        Reading Detail
                      </h3>
                      {formData.inspectionRecords.length > 1 && (
                        <button
                          onClick={() => removeRecord(index)}
                          className="ml-auto p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300"
                          title="Remove Entry"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`p-6 rounded-3xl border transition-all duration-300 ${record.top.pass ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-gray-600 uppercase tracking-widest">
                            Moisture Reading
                          </span>
                          <div>
                            {record.top.pass ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-emerald-200 uppercase tracking-wider">
                                <Check size={10} strokeWidth={4} /> Pass
                              </span>
                            ) : record.top.fail ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-rose-200 uppercase tracking-wider">
                                <X size={10} strokeWidth={4} /> Fail
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                            Reading Value (%)
                          </span>
                          <input
                            type="number"
                            value={record.top.body}
                            onChange={(e) =>
                              updateSectionData(
                                index,
                                "top",
                                "body",
                                e.target.value,
                              )
                            }
                            className={`w-full bg-white border-2 border-transparent rounded-2xl px-5 py-3 text-lg font-bold text-gray-700 shadow-sm focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${!formData.factoryStyleNo ? "cursor-not-allowed opacity-50" : ""}`}
                            placeholder="0.0"
                            disabled={!formData.factoryStyleNo}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Photo Section */}
                  <div className="lg:w-2/3 flex flex-col bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                          <ImageIcon size={18} className="text-rose-500" />
                          Inspection Photos
                        </h4>
                        <p className="text-sm font-bold text-gray-500 mt-0.5 ">
                          Maximum 4 reference images per entry
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById(`image-upload-${index}`)
                            ?.click()
                        }
                        disabled={!formData.factoryStyleNo}
                        className={`group/up flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-200 hover:bg-rose-600 hover:scale-105 transition-all duration-300 ${!formData.factoryStyleNo ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <UploadCloud
                          size={14}
                          className="group-hover/up:animate-bounce"
                        />
                        UPLOAD PHOTOS
                      </button>
                    </div>

                    <div className="flex-1">
                      <input
                        id={`image-upload-${index}`}
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) =>
                          handleImageUpload(index, e.target.files)
                        }
                        className="hidden"
                        disabled={!formData.factoryStyleNo}
                      />

                      {record.images?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-full min-h-[140px]">
                          {record.images.map((img, i) => (
                            <div
                              key={img.id || i}
                              className="group/img relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-white shadow-md transition-all duration-500 hover:border-rose-300 hover:shadow-xl"
                            >
                              <img
                                src={img.preview || ""}
                                alt={img.name || `thumb-${i}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index, img.id);
                                  }}
                                  className="p-2 bg-white text-rose-600 rounded-full shadow-lg transform translate-y-4 group-hover/img:translate-y-0 shadow-rose-900/20 transition-all duration-300 hover:scale-110 font-black"
                                >
                                  <X size={16} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {record.images.length < 4 && (
                            <button
                              onClick={() =>
                                document
                                  .getElementById(`image-upload-${index}`)
                                  ?.click()
                              }
                              className="w-full aspect-square rounded-[1.5rem] border-2 border-dashed border-rose-200 bg-rose-50/30 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-400 transition-all duration-300 group/empty"
                            >
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-300 group-hover/empty:text-rose-500 group-hover/empty:scale-110 transition-all">
                                <ImageIcon size={20} />
                              </div>
                              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest group-hover/empty:text-rose-500">
                                ADD MORE
                              </span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`flex flex-col items-center justify-center h-full min-h-[180px] rounded-[2rem] border-2 border-dashed transition-all duration-300 ${formData.factoryStyleNo ? "border-rose-100 bg-white hover:border-rose-300 hover:bg-rose-50/50" : "border-gray-200 bg-gray-50 opacity-60"}`}
                          onClick={() =>
                            formData.factoryStyleNo &&
                            document
                              .getElementById(`image-upload-${index}`)
                              ?.click()
                          }
                        >
                          <div className="p-4 bg-rose-50 rounded-full text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud size={32} />
                          </div>
                          <div className="text-center px-6">
                            <p className="text-sm font-black text-gray-700 uppercase">
                              {formData.factoryStyleNo
                                ? "Drop images here or click to browse"
                                : "Select Style # to upload photos"}
                            </p>
                            <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                              PNG, JPG or WebP (Max 5MB per file)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 ">
          <h3 className="text-xl font-bold text-gray-600 mb-4">
            <MessageSquare className="inline mr-2 text-gray-600" size={18} />
            Remark
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <textarea
                value={formData?.generalRemark || ""}
                onChange={(e) => safeSet("generalRemark", e.target.value)}
                className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3"
                placeholder="Enter remark here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save / Actions */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-rose-500 hover:bg-rose-600 hover:scale-105 transition-all duration-300 text-white px-6 py-2 rounded-md font-semibold shadow"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ReitmansForm;
