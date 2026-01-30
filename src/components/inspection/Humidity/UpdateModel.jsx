import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

export default function UpdateModel({ open, onCancel, report, onUpdate }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    buyerStyle: "",
    factoryStyleNo: "",
    customer: "",
    fabrication: "",
    aquaboySpec: "",
    aquaboySpecBody: "",
    aquaboySpecRibs: "",
    colorName: "",
    beforeDryRoom: "",
    beforeDryRoomTime: "",
    afterDryRoom: "",
    afterDryRoomTime: "",
    date: "",
    inspectionType: "Inline",
    inspectionRecords: [],
    generalRemark: "",
    inspectorSignature: "",
    qamSignature: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isSaving, setIsSaving] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [colorSearch, setColorSearch] = useState("");
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const colorRef = useRef(null);

  const ribsAvailable = report?.ribsAvailable ?? true;

  useEffect(() => {
    if (open && report) {
      let sourceRecords = [];
      if (report.inspectionRecords && report.inspectionRecords.length > 0) {
        sourceRecords = report.inspectionRecords;
      } else if (report.history && typeof report.history === "object") {
        // Convert nested Map history (Item -> Check) to latest records for editing
        const historyMap = report.history;
        sourceRecords = Object.keys(historyMap)
          .sort((a, b) => {
            const numA = parseInt(a.replace("Item ", ""));
            const numB = parseInt(b.replace("Item ", ""));
            return numA - numB;
          })
          .map((itemKey) => {
            const checks = historyMap[itemKey] || {};
            const checkKeys = Object.keys(checks).sort((a, b) => {
              const numA = parseInt(a.replace("Check ", ""));
              const numB = parseInt(b.replace("Check ", ""));
              return numB - numA; // Sort descending to get latest
            });
            return {
              ...checks[checkKeys[0]],
              itemName: itemKey, // Store the item name to identify it during save
              checkCount: checkKeys.length,
            };
          });
      }

      const specLimit = Number(report.aquaboySpecBody || report.aquaboySpec);
      const parseNumberInternal = (v) => {
        if (v === undefined || v === null) return NaN;
        const s = String(v).trim();
        if (s === "") return NaN;
        const cleaned = s.replace(/[^0-9.\-]/g, "");
        if (cleaned.length === 0) return NaN;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      };

      const safeRecords = sourceRecords.map((rec) => {
        const processSection = (sec) => {
          const body = sec?.body || "";
          const ribs = sec?.ribs || "";
          const bodyVal = parseNumberInternal(body);
          const ribsVal = parseNumberInternal(ribs);

          return {
            body,
            ribs,
            bodyPass:
              !Number.isNaN(bodyVal) && !Number.isNaN(specLimit)
                ? bodyVal <= specLimit
                : sec?.bodyPass || false,
            bodyFail:
              !Number.isNaN(bodyVal) && !Number.isNaN(specLimit)
                ? bodyVal > specLimit
                : sec?.bodyFail || false,
            ribsPass:
              !Number.isNaN(ribsVal) && !Number.isNaN(specLimit)
                ? ribsVal <= specLimit
                : sec?.ribsPass || false,
            ribsFail:
              !Number.isNaN(ribsVal) && !Number.isNaN(specLimit)
                ? ribsVal > specLimit
                : sec?.ribsFail || false,
            pass:
              sec?.pass === true ||
              sec?.status === "pass" ||
              (sec?.bodyPass && (!ribsAvailable || sec?.ribsPass)),
            fail:
              sec?.fail === true ||
              sec?.status === "fail" ||
              sec?.bodyFail ||
              (ribsAvailable && sec?.ribsFail),
          };
        };

        return {
          ...rec,
          top: processSection(rec.top),
          middle: processSection(rec.middle),
          bottom: processSection(rec.bottom),
          additional: rec.additional
            ? {
                top: processSection(rec.additional.top),
                middle: processSection(rec.additional.middle),
                bottom: processSection(rec.additional.bottom),
              }
            : {
                top: {
                  body: "",
                  ribs: "",
                  bodyPass: false,
                  bodyFail: false,
                  ribsPass: false,
                  ribsFail: false,
                  pass: false,
                  fail: false,
                },
                middle: {
                  body: "",
                  ribs: "",
                  bodyPass: false,
                  bodyFail: false,
                  ribsPass: false,
                  ribsFail: false,
                  pass: false,
                  fail: false,
                },
                bottom: {
                  body: "",
                  ribs: "",
                  bodyPass: false,
                  bodyFail: false,
                  ribsPass: false,
                  ribsFail: false,
                  pass: false,
                  fail: false,
                },
              },
          images: rec.images || [],
        };
      });

      if (safeRecords.length === 0) {
        safeRecords.push({
          top: {
            body: "",
            ribs: "",
            bodyPass: false,
            bodyFail: false,
            ribsPass: false,
            ribsFail: false,
            pass: false,
            fail: false,
          },
          middle: {
            body: "",
            ribs: "",
            bodyPass: false,
            bodyFail: false,
            ribsPass: false,
            ribsFail: false,
            pass: false,
            fail: false,
          },
          bottom: {
            body: "",
            ribs: "",
            bodyPass: false,
            bodyFail: false,
            ribsPass: false,
            ribsFail: false,
            pass: false,
            fail: false,
          },
          additional: {
            top: {
              body: "",
              ribs: "",
              bodyPass: false,
              bodyFail: false,
              ribsPass: false,
              ribsFail: false,
              pass: false,
              fail: false,
            },
            middle: {
              body: "",
              ribs: "",
              bodyPass: false,
              bodyFail: false,
              ribsPass: false,
              ribsFail: false,
              pass: false,
              fail: false,
            },
            bottom: {
              body: "",
              ribs: "",
              bodyPass: false,
              bodyFail: false,
              ribsPass: false,
              ribsFail: false,
              pass: false,
              fail: false,
            },
          },
          images: [],
        });
      }

      // Format beforeDryRoomTime from createdAt if available
      let initialBeforeTime = "";
      if (report.createdAt) {
        const date = new Date(report.createdAt);
        initialBeforeTime = date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Format date from createdAt if available
      let initialDate = "";
      if (report.createdAt) {
        const dateObj = new Date(report.createdAt);
        initialDate = dateObj.toISOString().split("T")[0];
      }

      setFormData({
        buyerStyle: report.buyerStyle || "",
        factoryStyleNo: report.factoryStyleNo || "",
        customer: report.customer || "",
        fabrication: report.fabrication || "",
        aquaboySpec: report.aquaboySpec || "",
        aquaboySpecBody: report.aquaboySpecBody || report.aquaboySpec || "",
        aquaboySpecRibs: report.aquaboySpecRibs || report.aquaboySpec || "",
        colorName: report.colorName || "",
        beforeDryRoom: report.beforeDryRoom || "",
        beforeDryRoomTime: initialBeforeTime,
        afterDryRoom: report.afterDryRoom || "",
        afterDryRoomTime: "", // Always start empty as requested
        date: initialDate,
        inspectionType: report.inspectionType || "Inline",
        inspectionRecords: safeRecords,
        generalRemark: report.generalRemark || "",
        inspectorSignature: report.inspectorSignature || "",
        qamSignature: report.qamSignature || "",
      });
    }
  }, [open, report]);

  // Click outside to close color dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorRef.current && !colorRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available colors when factoryStyleNo changes or on load
  useEffect(() => {
    const fetchColors = async () => {
      if (open && formData.factoryStyleNo) {
        try {
          const base =
            API_BASE_URL && API_BASE_URL !== ""
              ? API_BASE_URL
              : "http://localhost:5001";
          const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
          const res = await fetch(
            `${prefix}/api/yorksys-orders/${encodeURIComponent(formData.factoryStyleNo)}`,
          );
          const json = await res.json();
          const order = json && json.data ? json.data : json || null;

          if (order) {
            const colors = [];
            if (Array.isArray(order.SKUData))
              colors.push(...order.SKUData.map((s) => s.Color).filter(Boolean));
            if (Array.isArray(order.OrderQtyByCountry)) {
              order.OrderQtyByCountry.forEach((c) => {
                if (Array.isArray(c.ColorQty))
                  c.ColorQty.forEach(
                    (col) => col.ColorName && colors.push(col.ColorName),
                  );
              });
            }
            const uniqueColors = [...new Set(colors)];
            setAvailableColors(uniqueColors);
          }
        } catch (err) {
          console.error("Error fetching colors:", err);
        }
      }
    };
    fetchColors();
  }, [open, formData.factoryStyleNo]);

  const updateSectionData = (recordIndex, section, field, value) => {
    setFormData((prev) => {
      const newRecords = [...prev.inspectionRecords];
      if (!newRecords[recordIndex]) return prev;

      const updatedRecord = { ...newRecords[recordIndex] };
      updatedRecord[section] = {
        ...updatedRecord[section],
        [field]: value,
      };

      // Auto-grading logic
      const specNumBody =
        Number(prev.aquaboySpecBody) || Number(prev.aquaboySpec);
      const specNumRibs =
        Number(prev.aquaboySpecRibs) || Number(prev.aquaboySpec);

      // Try to parse numeric readings from body and ribs (allow strings like "51")
      const parseNumber = (v) => {
        if (v === undefined || v === null) return NaN;
        const s = String(v).trim();
        if (s === "") return NaN;
        const cleaned = s.replace(/[^0-9.\-]/g, "");
        if (cleaned.length === 0) return NaN;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      };

      const bodyStr = String(updatedRecord[section].body || "").trim();
      const ribsStr = String(updatedRecord[section].ribs || "").trim();

      const bodyVal = parseNumber(bodyStr);
      const ribsVal = parseNumber(ribsStr);

      // Body Status
      if (
        bodyStr.length >= 2 &&
        !Number.isNaN(bodyVal) &&
        !Number.isNaN(specNumBody)
      ) {
        updatedRecord[section].bodyPass = bodyVal <= specNumBody;
        updatedRecord[section].bodyFail = bodyVal > specNumBody;
        updatedRecord[section].bodyStatus =
          bodyVal <= specNumBody ? "pass" : "fail";
      } else {
        updatedRecord[section].bodyPass = false;
        updatedRecord[section].bodyFail = false;
        updatedRecord[section].bodyStatus = "";
      }

      // Ribs Status
      if (
        ribsStr.length >= 2 &&
        !Number.isNaN(ribsVal) &&
        !Number.isNaN(specNumRibs)
      ) {
        updatedRecord[section].ribsPass = ribsVal <= specNumRibs;
        updatedRecord[section].ribsFail = ribsVal > specNumRibs;
        updatedRecord[section].ribsStatus =
          ribsVal <= specNumRibs ? "pass" : "fail";
      } else {
        updatedRecord[section].ribsPass = false;
        updatedRecord[section].ribsFail = false;
        updatedRecord[section].ribsStatus = "";
      }

      // Overall Status (Synthesis)
      // We wait for all available inputs before showing a row-level verdict
      const isBodyMissing = Number.isNaN(bodyVal);
      const isRibsMissing = ribsAvailable && Number.isNaN(ribsVal);

      if (isBodyMissing || isRibsMissing) {
        updatedRecord[section].pass = false;
        updatedRecord[section].fail = false;
        updatedRecord[section].status = "";
      } else {
        const hasFail =
          updatedRecord[section].bodyFail ||
          (ribsAvailable && updatedRecord[section].ribsFail);
        let hasPass = false;
        if (ribsAvailable) {
          hasPass =
            updatedRecord[section].bodyPass && updatedRecord[section].ribsPass;
        } else {
          hasPass = updatedRecord[section].bodyPass;
        }

        if (hasFail) {
          updatedRecord[section].pass = false;
          updatedRecord[section].fail = true;
          updatedRecord[section].status = "fail";
        } else if (hasPass) {
          updatedRecord[section].pass = true;
          updatedRecord[section].fail = false;
          updatedRecord[section].status = "pass";
        } else {
          updatedRecord[section].pass = false;
          updatedRecord[section].fail = false;
          updatedRecord[section].status = "";
        }
      }

      newRecords[recordIndex] = updatedRecord;
      return { ...prev, inspectionRecords: newRecords };
    });
  };

  const setPassFail = (recordIndex, section, isPass) => {
    setFormData((prev) => {
      const newRecords = [...prev.inspectionRecords];
      newRecords[recordIndex][section].pass = isPass;
      newRecords[recordIndex][section].fail = !isPass;
      return { ...prev, inspectionRecords: newRecords };
    });
  };

  const updateAdditionalSectionData = (recordIndex, section, field, value) => {
    setFormData((prev) => {
      const newRecords = [...prev.inspectionRecords];
      if (!newRecords[recordIndex].additional) {
        newRecords[recordIndex].additional = {
          top: { body: "", ribs: "", pass: false, fail: false },
          middle: { body: "", ribs: "", pass: false, fail: false },
          bottom: { body: "", ribs: "", pass: false, fail: false },
        };
      }
      newRecords[recordIndex].additional[section] = {
        ...newRecords[recordIndex].additional[section],
        [field]: value,
      };

      // Auto-grading logic for additional readings
      const specNumBody =
        Number(prev.aquaboySpecBody) || Number(prev.aquaboySpec);
      const specNumRibs =
        Number(prev.aquaboySpecRibs) || Number(prev.aquaboySpec);

      const parseNumber = (v) => {
        if (v === undefined || v === null) return NaN;
        const s = String(v).trim();
        if (s === "") return NaN;
        const cleaned = s.replace(/[^0-9.\-]/g, "");
        if (cleaned.length === 0) return NaN;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      };

      const bodyStr = String(
        newRecords[recordIndex].additional[section].body || "",
      ).trim();
      const ribsStr = String(
        newRecords[recordIndex].additional[section].ribs || "",
      ).trim();

      const bodyVal = parseNumber(bodyStr);
      const ribsVal = parseNumber(ribsStr);

      // Body Status
      if (
        bodyStr.length >= 2 &&
        !Number.isNaN(bodyVal) &&
        !Number.isNaN(specNumBody)
      ) {
        newRecords[recordIndex].additional[section].bodyPass =
          bodyVal <= specNumBody;
        newRecords[recordIndex].additional[section].bodyFail =
          bodyVal > specNumBody;
        newRecords[recordIndex].additional[section].bodyStatus =
          bodyVal <= specNumBody ? "pass" : "fail";
      } else {
        newRecords[recordIndex].additional[section].bodyPass = false;
        newRecords[recordIndex].additional[section].bodyFail = false;
        newRecords[recordIndex].additional[section].bodyStatus = "";
      }

      // Ribs Status
      if (
        ribsStr.length >= 2 &&
        !Number.isNaN(ribsVal) &&
        !Number.isNaN(specNumRibs)
      ) {
        newRecords[recordIndex].additional[section].ribsPass =
          ribsVal <= specNumRibs;
        newRecords[recordIndex].additional[section].ribsFail =
          ribsVal > specNumRibs;
        newRecords[recordIndex].additional[section].ribsStatus =
          ribsVal <= specNumRibs ? "pass" : "fail";
      } else {
        newRecords[recordIndex].additional[section].ribsPass = false;
        newRecords[recordIndex].additional[section].ribsFail = false;
        newRecords[recordIndex].additional[section].ribsStatus = "";
      }

      // Overall Status (Synthesis)
      const isBodyMissing = Number.isNaN(bodyVal);
      const isRibsMissing = ribsAvailable && Number.isNaN(ribsVal);

      if (isBodyMissing || isRibsMissing) {
        newRecords[recordIndex].additional[section].pass = false;
        newRecords[recordIndex].additional[section].fail = false;
        newRecords[recordIndex].additional[section].status = "";
      } else {
        const hasFail =
          newRecords[recordIndex].additional[section].bodyFail ||
          (ribsAvailable &&
            newRecords[recordIndex].additional[section].ribsFail);
        let hasPass = false;
        if (ribsAvailable) {
          hasPass =
            newRecords[recordIndex].additional[section].bodyPass &&
            newRecords[recordIndex].additional[section].ribsPass;
        } else {
          hasPass = newRecords[recordIndex].additional[section].bodyPass;
        }

        if (hasFail) {
          newRecords[recordIndex].additional[section].pass = false;
          newRecords[recordIndex].additional[section].fail = true;
          newRecords[recordIndex].additional[section].status = "fail";
        } else if (hasPass) {
          newRecords[recordIndex].additional[section].pass = true;
          newRecords[recordIndex].additional[section].fail = false;
          newRecords[recordIndex].additional[section].status = "pass";
        } else {
          newRecords[recordIndex].additional[section].pass = false;
          newRecords[recordIndex].additional[section].fail = false;
          newRecords[recordIndex].additional[section].status = "";
        }
      }

      return { ...prev, inspectionRecords: newRecords };
    });
  };

  // Image upload handlers
  const handleImageUpload = async (recordIndex, files) => {
    const validFiles = Array.from(files).filter((file) => {
      const isValidType = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    // Convert files to Base64 for database storage
    const imagePromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            preview: reader.result, // Base64 string
            name: file.name,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(imagePromises);

    setFormData((prev) => {
      const newRecords = [...prev.inspectionRecords];
      if (!newRecords[recordIndex]) return prev;

      const currentImages = newRecords[recordIndex].images || [];
      newRecords[recordIndex] = {
        ...newRecords[recordIndex],
        images: [...currentImages, ...newImages],
      };
      return { ...prev, inspectionRecords: newRecords };
    });
  };

  const removeImage = (recordIndex, imageId) => {
    setFormData((prev) => {
      const newRecords = [...prev.inspectionRecords];
      if (!newRecords[recordIndex]) return prev;

      const currentImages = newRecords[recordIndex].images || [];
      newRecords[recordIndex] = {
        ...newRecords[recordIndex],
        images: currentImages.filter((img) => img.id !== imageId),
      };
      return { ...prev, inspectionRecords: newRecords };
    });
  };

  const addNewRecord = () => {
    setFormData((prev) => ({
      ...prev,
      inspectionRecords: [
        ...prev.inspectionRecords,
        {
          top: { body: "", ribs: "", pass: false, fail: false },
          middle: { body: "", ribs: "", pass: false, fail: false },
          bottom: { body: "", ribs: "", pass: false, fail: false },
          additional: {
            top: { body: "", ribs: "", pass: false, fail: false },
            middle: { body: "", ribs: "", pass: false, fail: false },
            bottom: { body: "", ribs: "", pass: false, fail: false },
          },
          images: [],
        },
      ],
    }));
  };

  const removeRecord = (index) => {
    if (formData.inspectionRecords.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      inspectionRecords: prev.inspectionRecords.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const base =
        API_BASE_URL && API_BASE_URL !== ""
          ? API_BASE_URL
          : "http://localhost:5001";
      const prefix = base.endsWith("/") ? base.slice(0, -1) : base;

      // Form validation
      if (!formData.afterDryRoomTime) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: "After Dry Room Time is required.",
        });
        setIsSaving(false);
        return;
      }

      // Map inspectionRecords to history format for the backend
      const currentEditRecords = formData.inspectionRecords.map((rec) => ({
        top: {
          body: rec.top.body,
          ribs: rec.top.ribs,
          status: rec.top.pass ? "pass" : rec.top.fail ? "fail" : "",
        },
        middle: {
          body: rec.middle.body,
          ribs: rec.middle.ribs,
          status: rec.middle.pass ? "pass" : rec.middle.fail ? "fail" : "",
        },
        bottom: {
          body: rec.bottom.body,
          ribs: rec.bottom.ribs,
          status: rec.bottom.pass ? "pass" : rec.bottom.fail ? "fail" : "",
        },
        additional: rec.additional
          ? {
              top: {
                body: rec.additional.top?.body || "",
                ribs: rec.additional.top?.ribs || "",
                status: rec.additional.top?.pass
                  ? "pass"
                  : rec.additional.top?.fail
                    ? "fail"
                    : "",
              },
              middle: {
                body: rec.additional.middle?.body || "",
                ribs: rec.additional.middle?.ribs || "",
                status: rec.additional.middle?.pass
                  ? "pass"
                  : rec.additional.middle?.fail
                    ? "fail"
                    : "",
              },
              bottom: {
                body: rec.additional.bottom?.body || "",
                ribs: rec.additional.bottom?.ribs || "",
                status: rec.additional.bottom?.pass
                  ? "pass"
                  : rec.additional.bottom?.fail
                    ? "fail"
                    : "",
              },
            }
          : undefined,
        images: rec.images || [],
        date: formData.date || rec.date,
        beforeDryRoom:
          formData.beforeDryRoomTime ||
          formData.beforeDryRoom ||
          rec.beforeDryRoomTime ||
          rec.beforeDryRoom ||
          "",
        afterDryRoom:
          formData.afterDryRoomTime ||
          formData.afterDryRoom ||
          rec.afterDryRoomTime ||
          rec.afterDryRoom ||
          "",
        generalRemark: formData.generalRemark || rec.remark || "",
      }));

      const previousHistory = { ...(report.history || {}) };

      currentEditRecords.forEach((rec, index) => {
        const itemKey = rec.itemName || `Item ${index + 1}`;
        const previousChecks =
          previousHistory[itemKey] &&
          typeof previousHistory[itemKey] === "object"
            ? previousHistory[itemKey]
            : {};
        const checkKeys = Object.keys(previousChecks).sort((a, b) => {
          const numA = parseInt(a.replace("Check ", ""));
          const numB = parseInt(b.replace("Check ", ""));
          return numB - numA;
        });

        const latestCheck = previousChecks[checkKeys[0]];
        const newCheckNumber = checkKeys.length + 1;
        const newCheckKey = `Check ${newCheckNumber}`;

        // Simplified change detection: checking if readings changed
        const isChanged =
          !latestCheck ||
          String(rec.top?.body) !== String(latestCheck.top?.body) ||
          String(rec.middle?.body) !== String(latestCheck.middle?.body) ||
          String(rec.bottom?.body) !== String(latestCheck.bottom?.body) ||
          String(rec.top?.ribs) !== String(latestCheck.top?.ribs) ||
          String(rec.middle?.ribs) !== String(latestCheck.middle?.ribs) ||
          String(rec.bottom?.ribs) !== String(latestCheck.bottom?.ribs);

        if (isChanged) {
          previousHistory[itemKey] = {
            ...previousChecks,
            [newCheckKey]: {
              ...rec,
              date: formData.date || new Date().toISOString(),
              saveTime: new Date().toLocaleTimeString("en-US", {
                hour12: true,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            },
          };
        }
      });

      const payload = {
        ...formData,
        history: previousHistory,
        updatedBy: user
          ? {
              empId: user.emp_id,
              engName: user.eng_name || user.name || user.username,
            }
          : null,
        ribsAvailable: ribsAvailable,
        inspectionRecords: currentEditRecords,
      };

      const response = await fetch(
        `${prefix}/api/humidity-reports/${report._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: "Report updated successfully!" });
        onUpdate();
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to update report",
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error updating report" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 transition-opacity">
      <style>{`
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden"
        style={{ animation: "modalPop 0.3s ease-out" }}
      >
        <div className="p-6 border-b flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-blue-500">
              Edit Inspection Record
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="update-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Meta Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Factory Style No
                </label>
                <input
                  type="text"
                  value={formData.factoryStyleNo}
                  onChange={(e) =>
                    setFormData({ ...formData, factoryStyleNo: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Buyer Style
                </label>
                <input
                  type="text"
                  value={formData.buyerStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerStyle: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fabrication
                </label>
                <input
                  type="text"
                  value={formData.fabrication}
                  onChange={(e) =>
                    setFormData({ ...formData, fabrication: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                  readOnly
                />
              </div>
              <div ref={colorRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select or type color..."
                    value={colorSearch || formData.colorName}
                    onFocus={() => {
                      setColorSearch("");
                      setShowColorDropdown(true);
                    }}
                    onChange={(e) => {
                      setColorSearch(e.target.value);
                      setFormData({ ...formData, colorName: e.target.value });
                      setShowColorDropdown(true);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 cursor-pointer"
                    onClick={() => {
                      if (!showColorDropdown) setColorSearch("");
                      setShowColorDropdown(!showColorDropdown);
                    }}
                  >
                    <svg
                      className={`fill-current h-4 w-4 transition-transform ${showColorDropdown ? "rotate-180" : ""}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>

                  {showColorDropdown && (
                    <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[200px]">
                      {availableColors.length > 0 ? (
                        availableColors
                          .filter(
                            (c) =>
                              !colorSearch ||
                              c
                                .toLowerCase()
                                .includes(colorSearch.toLowerCase()),
                          )
                          .map((color, idx) => (
                            <div
                              key={idx}
                              className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                                formData.colorName === color
                                  ? "bg-blue-50 text-blue-700"
                                  : "hover:bg-blue-600 hover:text-white text-gray-700"
                              }`}
                              onClick={() => {
                                setFormData({ ...formData, colorName: color });
                                setColorSearch(color);
                                setShowColorDropdown(false);
                              }}
                            >
                              {color}
                            </div>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-gray-400 italic">
                          No suggested colors for this style.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aquaboy Reading Spec (Body)
                </label>
                <input
                  type="text"
                  value={formData.aquaboySpecBody}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aquaboySpecBody: e.target.value,
                    })
                  }
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Before Dry Room Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.beforeDryRoomTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      beforeDryRoomTime: e.target.value,
                    })
                  }
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                />
              </div>
              {ribsAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Aquaboy Reading Spec (Ribs)
                  </label>
                  <input
                    type="text"
                    value={formData.aquaboySpecRibs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aquaboySpecRibs: e.target.value,
                      })
                    }
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  After Dry Room Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.afterDryRoomTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      afterDryRoomTime: e.target.value,
                    })
                  }
                  onFocus={() => {
                    const now = new Date();
                    // Format time as HH:mm for type="time"
                    const timeString =
                      now.getHours().toString().padStart(2, "0") +
                      ":" +
                      now.getMinutes().toString().padStart(2, "0");
                    // Format date as YYYY-MM-DD for type="date"
                    const dateString =
                      now.getFullYear() +
                      "-" +
                      (now.getMonth() + 1).toString().padStart(2, "0") +
                      "-" +
                      now.getDate().toString().padStart(2, "0");

                    setFormData((prev) => ({
                      ...prev,
                      afterDryRoomTime: timeString, // Always update to current time
                      date: dateString, // Always update to current date
                    }));
                  }}
                  onClick={(e) => {
                    // Also trigger on click to be safe, but focus usually handles it
                    if (!formData.afterDryRoomTime || !formData.date) {
                      e.target.focus();
                    }
                  }}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                />
              </div>
            </div>

            {/* Inspection Records */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Readings</h3>
                {/* <button
                  type="button"
                  onClick={addNewRecord}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Record
                </button> */}
              </div>
              <div className="space-y-4">
                {formData.inspectionRecords.map((record, index) => (
                  <div
                    key={`record-${index}`}
                    className="border rounded-lg p-4 bg-gray-50 mb-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-700">
                        Record #{index + 1}
                      </h4>
                      {/* {formData.inspectionRecords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecord(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove record
                        </button>
                      )} */}
                    </div>

                    <div className="space-y-4">
                      {["top", "middle", "bottom"].map((section) => (
                        <div
                          key={section}
                          className="flex flex-col md:flex-row gap-4 w-full items-center p-3 rounded-xl shadow-sm bg-white border border-gray-100"
                        >
                          <div className="w-20 font-bold capitalize text-gray-700">
                            {section}
                          </div>

                          {/* Body Reading + Status */}
                          <div className="flex flex-1 items-center gap-2 w-full">
                            <div className="flex-1">
                              <input
                                type="number"
                                placeholder="Body"
                                value={record[section].body}
                                onChange={(e) =>
                                  updateSectionData(
                                    index,
                                    section,
                                    "body",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                              />
                            </div>
                            {record[section].bodyPass ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Pass
                              </span>
                            ) : record[section].bodyFail ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                Fail
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs px-2 italic">
                                N/A
                              </span>
                            )}
                          </div>

                          {ribsAvailable && (
                            <div className="flex flex-1 items-center gap-2 w-full">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  placeholder="Ribs"
                                  value={record[section].ribs}
                                  onChange={(e) =>
                                    updateSectionData(
                                      index,
                                      section,
                                      "ribs",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                />
                              </div>
                              {record[section].ribsPass ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Pass
                                </span>
                              ) : record[section].ribsFail ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                  Fail
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs px-2 italic">
                                  N/A
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Images */}
                    <div className="mt-4 border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Inspection Photos
                      </h5>
                      <div className="space-y-3">
                        <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none hover:bg-gray-50">
                          <span className="flex items-center space-x-2">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="font-medium text-gray-600">
                              Click to upload images
                            </span>
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(index, e.target.files)
                            }
                          />
                        </label>
                        {record.images?.length > 0 && (
                          <div className="grid grid-cols-4 gap-4 mt-2">
                            {record.images.map((img) => (
                              <div
                                key={img.id}
                                className="relative aspect-square"
                              >
                                <img
                                  src={img.preview}
                                  className="h-full w-full object-cover rounded-lg border"
                                  alt=""
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index, img.id)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Readings if applicable */}
            {(formData.inspectionType === "Pre-Final" ||
              formData.inspectionType === "Final") && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Additional Readings
                  </h3>
                </div>
                <div className="space-y-4">
                  {formData.inspectionRecords.map((record, index) => (
                    <div
                      key={`add-${index}`}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4"
                    >
                      <h4 className="font-bold text-gray-700 mb-3 underline decoration-blue-500/30 underline-offset-4">
                        Record #{index + 1} Additional
                      </h4>

                      <div className="space-y-4">
                        {["top", "middle", "bottom"].map((section) => (
                          <div
                            key={section}
                            className="flex flex-col md:flex-row gap-4 w-full items-center p-3 rounded-xl shadow-sm bg-white border border-gray-100"
                          >
                            <div className="w-20 font-bold capitalize text-gray-700">
                              {section}
                            </div>

                            {/* Body Reading */}
                            <div className="flex flex-1 items-center gap-2 w-full">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  placeholder="Body"
                                  value={
                                    record.additional?.[section]?.body || ""
                                  }
                                  onChange={(e) =>
                                    updateAdditionalSectionData(
                                      index,
                                      section,
                                      "body",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                />
                              </div>
                              {record.additional?.[section]?.bodyPass ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Pass
                                </span>
                              ) : record.additional?.[section]?.bodyFail ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                  Fail
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs px-2 italic">
                                  N/A
                                </span>
                              )}
                            </div>

                            {ribsAvailable && (
                              <div className="flex flex-1 items-center gap-2 w-full">
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    placeholder="Ribs"
                                    value={
                                      record.additional?.[section]?.ribs || ""
                                    }
                                    onChange={(e) =>
                                      updateAdditionalSectionData(
                                        index,
                                        section,
                                        "ribs",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                  />
                                </div>
                                {record.additional?.[section]?.ribsPass ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                    <svg
                                      className="w-3 h-3 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Pass
                                  </span>
                                ) : record.additional?.[section]?.ribsFail ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                    <svg
                                      className="w-3 h-3 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                    Fail
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs px-2 italic">
                                    N/A
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Remark */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Remark
              </label>
              <textarea
                value={formData.generalRemark}
                onChange={(e) =>
                  setFormData({ ...formData, generalRemark: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm border p-3 min-h-[100px] focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any general remarks here..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="update-form"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Update Report"}
          </button>
        </div>
      </div>

      {/* Premium Message Banner */}
      {message.text && (
        <div
          className={`fixed bottom-6 right-6 z-[200] flex items-center gap-4 p-4 pl-5 pr-6 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-right-8 ${
            message.type === "success"
              ? "text-emerald-900 bg-white/95 border-emerald-100 ring-8 ring-emerald-500/5"
              : "text-rose-900 bg-white/95 border-rose-100 ring-8 ring-rose-500/5"
          }`}
          role="alert"
        >
          <div className="relative">
            {message.type === "success" ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-bounce-slow">
                <CheckCircle2 size={24} strokeWidth={3} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <AlertCircle size={24} strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 pr-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">
              Notification
            </span>
            <div className="text-sm font-black tracking-tight leading-tight">
              {message.text}
            </div>
          </div>

          <button
            type="button"
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              message.type === "success"
                ? "text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                : "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
            }`}
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Close"
          >
            <X size={18} strokeWidth={3} />
          </button>

          {/* Tiny Progress Bar */}
          <div
            className={`absolute bottom-0 left-0 h-1 rounded-full opacity-30 ${message.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{
              width: "100%",
              animation: "shrink-width 3s linear forwards",
            }}
          ></div>
        </div>
      )}

      <style>{`
                @keyframes shrink-width {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
            `}</style>
    </div>
  );
}
