import axios from "axios";
import { Keyboard, Save } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext"; // Assuming useAuth is here
import NumberPad from "../../forms/NumberPad"; // Assuming NumberPad is here
import MeasurementTableModify from "./MeasurementTableModify"; // A modified/adapted version

const CuttingInspectionModify = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  // Search and Selection
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [selectedMoNo, setSelectedMoNo] = useState("");
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [selectedTableNo, setSelectedTableNo] = useState("");
  const tableNoDropdownRef = useRef(null);

  // Fetched Data
  const [inspectionDoc, setInspectionDoc] = useState(null); // Original fetched document
  const [editableInspectionDoc, setEditableInspectionDoc] = useState(null); // Deep copy for editing
  const [markerRatios, setMarkerRatios] = useState([]);
  const [uniqueSizesForSelection, setUniqueSizesForSelection] = useState([]);

  // Top Level Fields (editable or recalculated)
  const [totalBundleQtyInput, setTotalBundleQtyInput] = useState("");
  const [bundleQtyCheckDisplay, setBundleQtyCheckDisplay] = useState("");
  const [totalInspectionQtyDisplay, setTotalInspectionQtyDisplay] = useState(0);
  const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
    useState(false);
  const [cuttingByType, setCuttingByType] = useState({
    auto: true,
    manual: false
  });
  const [garmentTypeDisplay, setGarmentTypeDisplay] = useState("");

  // Size Specific Editing
  const [selectedSizeForEdit, setSelectedSizeForEdit] = useState("");
  const [currentEditingSizeData, setCurrentEditingSizeData] = useState(null); // Points to item in editableInspectionDoc.inspectionData
  const [bundleQtyForSizeInput, setBundleQtyForSizeInput] = useState(""); // This is bundleQtyCheckSize for the selected size
  const [
    originalBundleQtyForSelectedSize,
    setOriginalBundleQtyForSelectedSize
  ] = useState(null); // For non-decreasing rule
  const [bundleQtyForSizeError, setBundleQtyForSizeError] = useState("");

  // For Bundle Details, Measurement, Defects (data will be part of currentEditingSizeData)
  // These states are for controlling UI elements like numpad/defectbox
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentMeasurementCell, setCurrentMeasurementCell] = useState(null); // { bundleIndex, partIndex, mpIndex, locIndex, valueIndex }
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [currentDefectCell, setCurrentDefectCell] = useState(null); // { bundleIndex, partIndex, locIndex, pcsNameIndex }

  // Supporting data (like in Cutting.jsx)
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [fabricDefectsList, setFabricDefectsList] = useState([]); // List of available fabric defects
  const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 }); // Default, might load from doc

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top"); // For MeasurementTableModify
  const [showNumberPadTotalBundle, setShowNumberPadTotalBundle] =
    useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsTablet(
      /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
        (userAgent.includes("mobile") && !userAgent.includes("phone"))
    );
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      )
        setShowMoNoDropdown(false);
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      )
        setShowTableNoDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch MO Numbers
  useEffect(() => {
    if (moNoSearch.trim() === "") {
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
      return;
    }
    const fetchMo = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers for modify:", error);
      }
    };
    const debounceFetch = setTimeout(fetchMo, 300);
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  // Fetch Table Numbers
  useEffect(() => {
    if (!selectedMoNo) {
      setTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          { params: { moNo: selectedMoNo, search: tableNoSearch } }
        );
        setTableNoOptions(response.data);
        setShowTableNoDropdown(
          response.data.length > 0 || tableNoSearch.length > 0
        );
      } catch (error) {
        console.error("Error fetching Table numbers for modify:", error);
      }
    };
    const debounceFetch = setTimeout(fetchTables, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedMoNo, tableNoSearch]);

  // Fetch Full Inspection Document
  useEffect(() => {
    if (!selectedMoNo || !selectedTableNo) {
      setInspectionDoc(null);
      setEditableInspectionDoc(null);
      resetSubsequentStates();
      return;
    }
    const fetchInspectionDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
          {
            params: { moNo: selectedMoNo, tableNo: selectedTableNo }
          }
        );
        const doc = response.data;
        setInspectionDoc(doc);
        setEditableInspectionDoc(JSON.parse(JSON.stringify(doc))); // Deep copy

        // Populate top-level fields
        setTotalBundleQtyInput(doc.totalBundleQty.toString());
        setBundleQtyCheckDisplay(doc.bundleQtyCheck.toString());
        setTotalInspectionQtyDisplay(doc.totalInspectionQty);
        setCuttingByType(
          doc.cuttingtype === "Auto"
            ? { auto: true, manual: false }
            : doc.cuttingtype === "Manual"
            ? { auto: false, manual: true }
            : doc.cuttingtype === "Auto & Manual"
            ? { auto: true, manual: true }
            : { auto: false, manual: false } // Default or handle other cases
        );
        setGarmentTypeDisplay(doc.garmentType);
        setMarkerRatios(doc.mackerRatio || []);
        const uniqueSizes = [
          ...new Set(
            (doc.mackerRatio || [])
              .filter((mr) => mr.ratio > 0)
              .map((mr) => mr.markerSize)
          )
        ];
        setUniqueSizesForSelection(uniqueSizes);

        // If there's inspectionData, potentially load tolerance from the first item
        if (
          doc.inspectionData &&
          doc.inspectionData.length > 0 &&
          doc.inspectionData[0].tolerance
        ) {
          setTolerance(doc.inspectionData[0].tolerance);
        }
      } catch (error) {
        console.error("Error fetching inspection details:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchInspectionDetails")
        });
        setInspectionDoc(null);
        setEditableInspectionDoc(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInspectionDetails();
  }, [selectedMoNo, selectedTableNo, t]);

  const resetSubsequentStates = () => {
    setMarkerRatios([]);
    setUniqueSizesForSelection([]);
    setTotalBundleQtyInput("");
    setBundleQtyCheckDisplay("");
    setTotalInspectionQtyDisplay(0);
    setCuttingByType({ auto: true, manual: false });
    setGarmentTypeDisplay("");
    setSelectedSizeForEdit("");
    setCurrentEditingSizeData(null);
    setBundleQtyForSizeInput("");
    setOriginalBundleQtyForSelectedSize(null);
    setBundleQtyForSizeError("");
    setPanelIndexNames([]);
    setMeasurementPoints([]);
  };

  // Recalculate BundleQtyCheck and TotalInspectionQty
  useEffect(() => {
    if (totalBundleQtyInput && editableInspectionDoc?.cuttingTableDetails) {
      const layersToUse =
        editableInspectionDoc.cuttingTableDetails.actualLayers ||
        editableInspectionDoc.cuttingTableDetails.planLayers ||
        0;
      const multiplication = parseInt(totalBundleQtyInput) * layersToUse;
      let calculatedBundleQtyCheck;
      if (multiplication >= 1 && multiplication <= 500)
        calculatedBundleQtyCheck = 3;
      else if (multiplication >= 501 && multiplication <= 1200)
        calculatedBundleQtyCheck = 5;
      else if (multiplication >= 1201 && multiplication <= 3000)
        calculatedBundleQtyCheck = 9;
      else if (multiplication >= 3201 && multiplication <= 10000)
        calculatedBundleQtyCheck = 14;
      else if (multiplication >= 10001 && multiplication <= 35000)
        calculatedBundleQtyCheck = 20;
      else calculatedBundleQtyCheck = ""; // Or some default/error handling
      setBundleQtyCheckDisplay(calculatedBundleQtyCheck.toString());
      if (!isTotalInspectionQtyManual && calculatedBundleQtyCheck) {
        setTotalInspectionQtyDisplay(calculatedBundleQtyCheck * 15);
      } else if (!isTotalInspectionQtyManual && !calculatedBundleQtyCheck) {
        setTotalInspectionQtyDisplay(0);
      }
    } else {
      setBundleQtyCheckDisplay("");
      if (!isTotalInspectionQtyManual) setTotalInspectionQtyDisplay(0);
    }
  }, [totalBundleQtyInput, editableInspectionDoc, isTotalInspectionQtyManual]);

  // Effect for when selectedSizeForEdit changes
  useEffect(() => {
    if (
      selectedSizeForEdit &&
      editableInspectionDoc &&
      editableInspectionDoc.inspectionData
    ) {
      const sizeData = editableInspectionDoc.inspectionData.find(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeData) {
        setCurrentEditingSizeData(sizeData);
        setBundleQtyForSizeInput(sizeData.bundleQtyCheckSize.toString());
        setOriginalBundleQtyForSelectedSize(sizeData.bundleQtyCheckSize); // Store original value
        if (sizeData.tolerance) setTolerance(sizeData.tolerance);
      } else {
        setCurrentEditingSizeData(null);
        setBundleQtyForSizeInput("");
        setOriginalBundleQtyForSelectedSize(null);
        Swal.fire({
          icon: "warning",
          title: "Size Not Found",
          text: `Inspection data for size ${selectedSizeForEdit} not found.`
        });
      }
    } else {
      setCurrentEditingSizeData(null);
      setBundleQtyForSizeInput("");
      setOriginalBundleQtyForSelectedSize(null);
    }
    setBundleQtyForSizeError("");
  }, [selectedSizeForEdit, editableInspectionDoc]);

  // Fetch PanelIndexNames and MeasurementPoints when MO and GarmentType are available
  useEffect(() => {
    if (selectedMoNo && garmentTypeDisplay) {
      const fetchSupportingData = async () => {
        try {
          // Fetch Panel Index Names
          const panelNamesRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-panel-index-names-by-mo`,
            {
              params: { moNo: selectedMoNo, panel: garmentTypeDisplay }
            }
          );
          setPanelIndexNames(panelNamesRes.data);

          // Fetch Measurement Points
          const mpRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-points`,
            {
              params: { moNo: selectedMoNo, panel: garmentTypeDisplay }
            }
          );
          const commonMpRes = await axios.get(
            `${API_BASE_URL}/api/cutting-measurement-points`,
            {
              params: { moNo: "Common", panel: garmentTypeDisplay }
            }
          );
          const combinedPoints = [...mpRes.data];
          commonMpRes.data.forEach((commonPoint) => {
            if (
              !combinedPoints.some(
                (p) =>
                  p.panelIndexName === commonPoint.panelIndexName &&
                  p.pointNameEng === commonPoint.pointNameEng
              )
            ) {
              combinedPoints.push(commonPoint);
            }
          });
          setMeasurementPoints(combinedPoints);
        } catch (error) {
          console.error(
            "Error fetching supporting data (panels/measurement points):",
            error
          );
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text: t("cutting.failedToFetchSupportingData")
          });
        }
      };
      fetchSupportingData();
    }
  }, [selectedMoNo, garmentTypeDisplay, t]);

  // Fetch Fabric Defects List
  useEffect(() => {
    const fetchFabricDefects = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-fabric-defects`
        );
        setFabricDefectsList(response.data);
      } catch (error) {
        console.error("Error fetching fabric defects:", error);
      }
    };
    fetchFabricDefects();
  }, []);

  // Handle Bundle Qty for Size Change and Validation
  const handleBundleQtyForSizeChange = (newQtyStr) => {
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty) || newQty < 0) {
      setBundleQtyForSizeError(t("cutting.invalidBundleQtyValue"));
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }

    if (
      originalBundleQtyForSelectedSize !== null &&
      newQty < originalBundleQtyForSelectedSize
    ) {
      setBundleQtyForSizeError(
        t("cutting.bundleQtyCannotBeDecreased", {
          original: originalBundleQtyForSelectedSize
        })
      );
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }
    if (!editableInspectionDoc || !bundleQtyCheckDisplay) {
      setBundleQtyForSizeInput(newQtyStr);
      return;
    }

    const mainBundleQtyCheck = parseInt(bundleQtyCheckDisplay);
    const sumOtherBundleQtyCheckSize = editableInspectionDoc.inspectionData
      .filter((d) => d.inspectedSize !== selectedSizeForEdit)
      .reduce((sum, d) => sum + d.bundleQtyCheckSize, 0);

    if (newQty > mainBundleQtyCheck - sumOtherBundleQtyCheckSize) {
      setBundleQtyForSizeError(
        t("cutting.bundleQtyExceedsLimit", {
          limit: mainBundleQtyCheck - sumOtherBundleQtyCheckSize
        })
      );
      setBundleQtyForSizeInput(newQtyStr);
    } else {
      setBundleQtyForSizeError("");
      setBundleQtyForSizeInput(newQtyStr);

      if (currentEditingSizeData) {
        const updatedSizeData = {
          ...currentEditingSizeData,
          bundleQtyCheckSize: newQty
        };

        const currentBundles = updatedSizeData.bundleInspectionData || [];
        if (newQty > currentBundles.length) {
          for (let i = currentBundles.length; i < newQty; i++) {
            currentBundles.push({
              bundleNo: i + 1,
              serialLetter: "",
              totalPcs: 0,
              pcs: { total: 0, top: 0, middle: 0, bottom: 0 },
              pass: { total: 0, top: 0, middle: 0, bottom: 0 },
              reject: { total: 0, top: 0, middle: 0, bottom: 0 },
              rejectGarment: { total: 0, top: 0, middle: 0, bottom: 0 },
              rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
              passrate: { total: 100, top: 100, middle: 100, bottom: 100 },
              measurementInsepctionData: [],
              pcsPerLocation: { t: 5, m: 5, b: 5 } // Default pcs per location for new bundles
            });
          }
        } else if (newQty < currentBundles.length) {
          currentBundles.splice(newQty);
        }
        currentBundles.forEach(
          (bundle, index) => (bundle.bundleNo = index + 1)
        );

        updatedSizeData.bundleInspectionData = currentBundles;
        setCurrentEditingSizeData(updatedSizeData);

        const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
        const sizeIndex = docCopy.inspectionData.findIndex(
          (item) => item.inspectedSize === selectedSizeForEdit
        );
        if (sizeIndex > -1) {
          docCopy.inspectionData[sizeIndex] = updatedSizeData;
          setEditableInspectionDoc(docCopy);
        }
      }
    }
  };

  const handlePartSelectionChange = (bundleIndex, partName, isChecked) => {
    if (!currentEditingSizeData) return;

    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    const bundleData = updatedSizeData.bundleInspectionData[bundleIndex];

    if (!bundleData.measurementInsepctionData) {
      bundleData.measurementInsepctionData = [];
    }

    const partInfo = panelIndexNames.find((p) => p.panelIndexName === partName);
    if (!partInfo) return;

    if (isChecked) {
      if (
        !bundleData.measurementInsepctionData.some(
          (p) => p.partName === partName
        )
      ) {
        bundleData.measurementInsepctionData.push({
          partName: partName,
          partNo: partInfo.panelIndex,
          partNameKhmer: partInfo.panelIndexNameKhmer,
          measurementPointsData: [],
          fabricDefects: [
            { location: "Top", defectData: [] },
            { location: "Middle", defectData: [] },
            { location: "Bottom", defectData: [] }
          ]
        });
      }
    } else {
      bundleData.measurementInsepctionData =
        bundleData.measurementInsepctionData.filter(
          (p) => p.partName !== partName
        );
    }

    const numPartsSelectedCurrentBundle =
      bundleData.measurementInsepctionData.length;
    // Use pcsPerLocation from bundle if it exists, otherwise default
    const tValueForBundle = bundleData.pcsPerLocation?.t || 5;
    const mValueForBundle = bundleData.pcsPerLocation?.m || 5;
    const bValueForBundle = bundleData.pcsPerLocation?.b || 5;

    bundleData.pcs.top = numPartsSelectedCurrentBundle * tValueForBundle;
    bundleData.pcs.middle = numPartsSelectedCurrentBundle * mValueForBundle;
    bundleData.pcs.bottom = numPartsSelectedCurrentBundle * bValueForBundle;
    bundleData.pcs.total =
      bundleData.pcs.top + bundleData.pcs.middle + bundleData.pcs.bottom;
    bundleData.totalPcs = bundleData.pcs.total;

    setCurrentEditingSizeData(updatedSizeData);
    const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
    const sizeIndex = docCopy.inspectionData.findIndex(
      (item) => item.inspectedSize === selectedSizeForEdit
    );
    if (sizeIndex > -1) {
      docCopy.inspectionData[sizeIndex] = updatedSizeData;
      setEditableInspectionDoc(docCopy);
    }
  };

  const handleSerialLetterChange = (bundleIndex, newSerialLetter) => {
    if (!currentEditingSizeData) return;
    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    if (updatedSizeData.bundleInspectionData[bundleIndex]) {
      updatedSizeData.bundleInspectionData[bundleIndex].serialLetter =
        newSerialLetter;
      setCurrentEditingSizeData(updatedSizeData);
      const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
      const sizeIndex = docCopy.inspectionData.findIndex(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeIndex > -1) {
        docCopy.inspectionData[sizeIndex] = updatedSizeData;
        setEditableInspectionDoc(docCopy);
      }
    }
  };

  const handlePcsPerLocationChange = (bundleIndex, location, newValueStr) => {
    if (!currentEditingSizeData) return;
    const newValue = parseInt(newValueStr);
    if (isNaN(newValue) || newValue < 1 || newValue > 5) return; // Basic validation

    const updatedSizeData = JSON.parse(JSON.stringify(currentEditingSizeData));
    const bundle = updatedSizeData.bundleInspectionData[bundleIndex];
    if (bundle) {
      if (!bundle.pcsPerLocation) bundle.pcsPerLocation = { t: 5, m: 5, b: 5 };
      if (location === "T") bundle.pcsPerLocation.t = newValue;
      else if (location === "M") bundle.pcsPerLocation.m = newValue;
      else if (location === "B") bundle.pcsPerLocation.b = newValue;

      // Recalculate totalPcs for this bundle
      const numPartsSelected = bundle.measurementInsepctionData?.length || 0;
      bundle.pcs.top = numPartsSelected * bundle.pcsPerLocation.t;
      bundle.pcs.middle = numPartsSelected * bundle.pcsPerLocation.m;
      bundle.pcs.bottom = numPartsSelected * bundle.pcsPerLocation.b;
      bundle.pcs.total = bundle.pcs.top + bundle.pcs.middle + bundle.pcs.bottom;
      bundle.totalPcs = bundle.pcs.total;

      setCurrentEditingSizeData(updatedSizeData);
      const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
      const sizeIndex = docCopy.inspectionData.findIndex(
        (item) => item.inspectedSize === selectedSizeForEdit
      );
      if (sizeIndex > -1) {
        docCopy.inspectionData[sizeIndex] = updatedSizeData;
        setEditableInspectionDoc(docCopy);
      }
    }
  };

  const serialLetters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const toleranceOptions = [
    { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
    { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } }
  ];

  const handleToleranceChange = (e) => {
    const selectedOption = toleranceOptions.find(
      (opt) => opt.label === e.target.value
    );
    if (selectedOption) {
      setTolerance(selectedOption.value);
      if (currentEditingSizeData) {
        const updatedSizeData = {
          ...currentEditingSizeData,
          tolerance: selectedOption.value
        };
        setCurrentEditingSizeData(updatedSizeData);
        const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
        const sizeIndex = docCopy.inspectionData.findIndex(
          (item) => item.inspectedSize === selectedSizeForEdit
        );
        if (sizeIndex > -1) {
          docCopy.inspectionData[sizeIndex].tolerance = selectedOption.value;
          setEditableInspectionDoc(docCopy);
        }
      }
    }
  };

  const handleMeasurementTableUpdate = (updatedBundleInspectionDataForSize) => {
    if (!currentEditingSizeData || !editableInspectionDoc) return;

    const updatedSizeData = {
      ...currentEditingSizeData,
      bundleInspectionData: updatedBundleInspectionDataForSize
    };

    let totalPcsSize = 0,
      totalPassSize = 0,
      totalRejectSize = 0;
    let totalRejectMeasurementSize = 0;

    updatedBundleInspectionDataForSize.forEach((bundle) => {
      totalPcsSize += bundle.totalPcs || 0;
      totalPassSize += bundle.pass?.total || 0;
      totalRejectSize += bundle.reject?.total || 0;
      totalRejectMeasurementSize += bundle.rejectMeasurement?.total || 0;
    });

    updatedSizeData.totalPcsSize = totalPcsSize;
    updatedSizeData.pcsSize = {
      total: totalPcsSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pcs?.bottom || 0),
        0
      )
    };
    updatedSizeData.passSize = {
      total: totalPassSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.pass?.bottom || 0),
        0
      )
    };
    updatedSizeData.rejectSize = {
      total: totalRejectSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.reject?.bottom || 0),
        0
      )
    };
    updatedSizeData.rejectMeasurementSize = {
      total: totalRejectMeasurementSize,
      top: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.top || 0),
        0
      ),
      middle: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.middle || 0),
        0
      ),
      bottom: updatedBundleInspectionDataForSize.reduce(
        (sum, b) => sum + (b.rejectMeasurement?.bottom || 0),
        0
      )
    };
    // Update passrateSize
    updatedSizeData.passrateSize = {
      total:
        totalPcsSize > 0
          ? parseFloat(((totalPassSize / totalPcsSize) * 100).toFixed(2))
          : 0,
      top:
        updatedSizeData.pcsSize.top > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.top / updatedSizeData.pcsSize.top) *
                100
              ).toFixed(2)
            )
          : 0,
      middle:
        updatedSizeData.pcsSize.middle > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.middle /
                  updatedSizeData.pcsSize.middle) *
                100
              ).toFixed(2)
            )
          : 0,
      bottom:
        updatedSizeData.pcsSize.bottom > 0
          ? parseFloat(
              (
                (updatedSizeData.passSize.bottom /
                  updatedSizeData.pcsSize.bottom) *
                100
              ).toFixed(2)
            )
          : 0
    };

    setCurrentEditingSizeData(updatedSizeData);

    const docCopy = JSON.parse(JSON.stringify(editableInspectionDoc));
    const sizeIndex = docCopy.inspectionData.findIndex(
      (item) => item.inspectedSize === selectedSizeForEdit
    );
    if (sizeIndex > -1) {
      docCopy.inspectionData[sizeIndex] = updatedSizeData;
      setEditableInspectionDoc(docCopy);
    }
  };

  const handleSave = async () => {
    if (!editableInspectionDoc || !currentEditingSizeData) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.noDataToSave"),
        text: t("cutting.loadAndEditDataFirst")
      });
      return;
    }
    if (bundleQtyForSizeError) {
      Swal.fire({
        icon: "error",
        title: t("cutting.validationError"),
        text: bundleQtyForSizeError
      });
      return;
    }

    setIsLoading(true);
    try {
      const cuttingTypeString =
        cuttingByType.auto && cuttingByType.manual
          ? "Auto & Manual"
          : cuttingByType.auto
          ? "Auto"
          : cuttingByType.manual
          ? "Manual"
          : "None";

      const payload = {
        moNo: selectedMoNo,
        tableNo: selectedTableNo,
        updatedFields: {
          totalBundleQty: parseInt(totalBundleQtyInput),
          bundleQtyCheck: parseInt(bundleQtyCheckDisplay),
          totalInspectionQty: parseInt(totalInspectionQtyDisplay),
          cuttingtype: cuttingTypeString
        },
        updatedInspectionDataItem: currentEditingSizeData
      };

      if (payload.updatedInspectionDataItem) {
        payload.updatedInspectionDataItem.updated_at = new Date();
        if (!payload.updatedInspectionDataItem.created_at) {
          payload.updatedInspectionDataItem.created_at = new Date();
        }
      }

      await axios.put(`${API_BASE_URL}/api/cutting-inspection-update`, payload);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataUpdatedSuccessfully")
      });

      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
        {
          params: { moNo: selectedMoNo, tableNo: selectedTableNo }
        }
      );
      setInspectionDoc(response.data);
      setEditableInspectionDoc(JSON.parse(JSON.stringify(response.data)));
      const currentSelSize = selectedSizeForEdit;
      setSelectedSizeForEdit("");
      setTimeout(() => setSelectedSizeForEdit(currentSelSize), 0);
    } catch (error) {
      console.error("Error updating inspection data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToUpdateData")
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="p-4 text-center">{t("loading")}</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {t("cutting.modifyCuttingInspection")}
        </h1>

        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div ref={moNoDropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.moNo")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={moNoSearch}
                onChange={(e) => {
                  setMoNoSearch(e.target.value);
                  setSelectedMoNo("");
                  setSelectedTableNo("");
                  setTableNoSearch("");
                }}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t("cutting.search_mono")}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              />
              {showMoNoDropdown && moNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {moNoOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedMoNo(option);
                        setMoNoSearch(option);
                        setShowMoNoDropdown(false);
                      }}
                      className="p-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div ref={tableNoDropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.tableNo")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={tableNoSearch}
                onChange={(e) => {
                  setTableNoSearch(e.target.value);
                  setSelectedTableNo("");
                }}
                onFocus={() =>
                  tableNoOptions.length > 0 && setShowTableNoDropdown(true)
                }
                placeholder={t("cutting.search_table_no")}
                className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
                  !selectedMoNo ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                disabled={!selectedMoNo}
              />
              {showTableNoDropdown && tableNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {tableNoOptions
                    .filter((opt) =>
                      opt.toLowerCase().includes(tableNoSearch.toLowerCase())
                    )
                    .map((option, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedTableNo(option);
                          setTableNoSearch(option);
                          setShowTableNoDropdown(false);
                        }}
                        className="p-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {option}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center p-4">{t("loadingData")}...</div>
        )}

        {editableInspectionDoc && (
          <>
            {/* Marker Ratio */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {t("cutting.markerRatio")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      {markerRatios
                        .filter((mr) => mr.ratio > 0)
                        .map((mr, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 p-2 text-sm"
                          >
                            {mr.markerSize}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {markerRatios
                        .filter((mr) => mr.ratio > 0)
                        .map((mr, index) => (
                          <td
                            key={index}
                            className="border border-gray-300 p-2 text-sm text-center"
                          >
                            {mr.ratio}
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Level Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border p-4 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.totalBundleQty")}
                </label>
                <div className="relative">
                  <input
                    type={isTablet ? "number" : "text"}
                    inputMode="numeric"
                    value={totalBundleQtyInput}
                    onChange={(e) => setTotalBundleQtyInput(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                  />
                  {!isTablet && (
                    <button
                      onClick={() => setShowNumberPadTotalBundle(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                    >
                      <Keyboard className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {showNumberPadTotalBundle && (
                  <NumberPad
                    onClose={() => setShowNumberPadTotalBundle(false)}
                    onInput={(val) => setTotalBundleQtyInput(val)}
                    initialValue={totalBundleQtyInput}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.bundleQtyCheck")}
                </label>
                <input
                  type="text"
                  value={bundleQtyCheckDisplay}
                  readOnly
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.totalInspectionQty")}
                </label>
                <input
                  type={isTablet ? "number" : "text"}
                  inputMode="numeric"
                  value={totalInspectionQtyDisplay}
                  onChange={(e) => {
                    setTotalInspectionQtyDisplay(e.target.value);
                    setIsTotalInspectionQtyManual(true);
                  }}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.cuttingBy")}
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cuttingByType.auto}
                      onChange={(e) =>
                        setCuttingByType({
                          ...cuttingByType,
                          auto: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {t("cutting.auto")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cuttingByType.manual}
                      onChange={(e) =>
                        setCuttingByType({
                          ...cuttingByType,
                          manual: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {t("cutting.manual")}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.garmentType")}
                </label>
                <input
                  type="text"
                  value={garmentTypeDisplay}
                  readOnly
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("cutting.tolerance")}
                </label>
                <select
                  value={
                    toleranceOptions.find(
                      (opt) =>
                        opt.value.min === tolerance.min &&
                        opt.value.max === tolerance.max
                    )?.label
                  }
                  onChange={handleToleranceChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                >
                  {toleranceOptions.map((option, index) => (
                    <option key={index} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size Selection for Editing */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                {t("cutting.selectSizeToEdit")}
              </label>
              <select
                value={selectedSizeForEdit}
                onChange={(e) => setSelectedSizeForEdit(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t("cutting.pleaseSelectASize")}</option>
                {(editableInspectionDoc.inspectionData || []).map((item) => (
                  <option key={item.inspectedSize} value={item.inspectedSize}>
                    {item.inspectedSize}
                  </option>
                ))}
              </select>
            </div>

            {currentEditingSizeData && (
              <div className="border p-4 rounded-md mt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  {t("editingInspectionForSize", { size: selectedSizeForEdit })}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.bundleQtyForThisSize")} (
                    {t("cutting.bundleQtyCheckSize")})
                  </label>
                  <input
                    type="number"
                    value={bundleQtyForSizeInput}
                    onChange={(e) =>
                      handleBundleQtyForSizeChange(e.target.value)
                    }
                    className={`mt-1 w-full md:w-1/3 p-2 border rounded-lg ${
                      bundleQtyForSizeError
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    min="0"
                  />
                  {bundleQtyForSizeError && (
                    <p className="text-red-500 text-sm mt-1">
                      {bundleQtyForSizeError}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">
                    {t("cutting.bundleDetails")}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-sm">
                            {t("cutting.bundleNo")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.serialLetter")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.parts")}
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.pcs")} (T/M/B)
                          </th>
                          <th className="border p-2 text-sm">
                            {t("cutting.totalPcs")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          currentEditingSizeData.bundleInspectionData || []
                        ).map((bundle, bundleIdx) => {
                          const isNewBundle =
                            !inspectionDoc.inspectionData.find(
                              (s) => s.inspectedSize === selectedSizeForEdit
                            )?.bundleInspectionData[bundleIdx];

                          return (
                            <tr key={bundle.bundleNo}>
                              <td className="border p-2 text-sm text-center">
                                {bundle.bundleNo}
                              </td>
                              <td className="border p-2 text-sm">
                                <select
                                  value={bundle.serialLetter}
                                  onChange={(e) =>
                                    handleSerialLetterChange(
                                      bundleIdx,
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-1 border rounded"
                                >
                                  <option value="">{t("select")}</option>
                                  {serialLetters.map((sl) => (
                                    <option key={sl} value={sl}>
                                      {sl}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border p-2 text-sm">
                                {isNewBundle ||
                                !(
                                  bundle.measurementInsepctionData &&
                                  bundle.measurementInsepctionData.length > 0
                                ) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {panelIndexNames.map((pName) => (
                                      <label
                                        key={pName.panelIndexName}
                                        className="flex items-center space-x-1"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={bundle.measurementInsepctionData?.some(
                                            (p) =>
                                              p.partName ===
                                              pName.panelIndexName
                                          )}
                                          onChange={(e) =>
                                            handlePartSelectionChange(
                                              bundleIdx,
                                              pName.panelIndexName,
                                              e.target.checked
                                            )
                                          }
                                        />
                                        <span>
                                          {i18n.language === "km"
                                            ? pName.panelIndexNameKhmer
                                            : pName.panelIndexName}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  bundle.measurementInsepctionData
                                    .map((p) =>
                                      i18n.language === "km"
                                        ? p.partNameKhmer
                                        : p.partName
                                    )
                                    .join(", ")
                                )}
                              </td>
                              <td className="border p-2 text-sm">
                                <div className="flex items-center gap-1">
                                  T:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.t || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "T",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                  M:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.m || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "M",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                  B:{" "}
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={bundle.pcsPerLocation?.b || 5}
                                    onChange={(e) =>
                                      handlePcsPerLocationChange(
                                        bundleIdx,
                                        "B",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 p-1 border rounded"
                                  />
                                </div>
                              </td>
                              <td className="border p-2 text-sm text-center">
                                {bundle.totalPcs || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <MeasurementTableModify
                  key={`${selectedSizeForEdit}-${
                    (currentEditingSizeData.bundleInspectionData || []).length
                  }-${JSON.stringify(
                    (currentEditingSizeData.bundleInspectionData || []).map(
                      (b) => b.pcsPerLocation
                    )
                  )}`}
                  initialBundleInspectionData={
                    currentEditingSizeData.bundleInspectionData || []
                  }
                  measurementPoints={measurementPoints}
                  panelIndexNames={panelIndexNames}
                  fabricDefectsList={fabricDefectsList}
                  tolerance={tolerance}
                  onUpdate={handleMeasurementTableUpdate}
                  garmentType={garmentTypeDisplay}
                  moNo={selectedMoNo}
                  activeMeasurementTab={activeMeasurementTab}
                  setActiveMeasurementTab={setActiveMeasurementTab}
                  pcsPerLocationInitial={(
                    currentEditingSizeData.bundleInspectionData || []
                  ).map((b) => b.pcsPerLocation || { t: 5, m: 5, b: 5 })}
                />
              </div>
            )}

            {currentEditingSizeData && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                >
                  <Save size={18} className="mr-2" />{" "}
                  {isLoading ? t("saving") : t("saveChanges")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CuttingInspectionModify;
