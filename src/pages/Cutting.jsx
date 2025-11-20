import axios from "axios";
import {
  AlertCircle,
  Box,
  CheckCircle,
  Database,
  Eye,
  EyeOff,
  Keyboard,
  Layers,
  Percent,
  Tag,
  XCircle
} from "lucide-react"; // Added icons for stats

import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import NumberPad from "../components/forms/NumberPad";
import AQLChart from "../components/inspection/cutting/AQLChart";
import CuttingInspectionModify from "../components/inspection/cutting/CuttingInspectionModify";
import CuttingIssues from "../components/inspection/cutting/CuttingIssues";
import CuttingMeasurementPointsModify from "../components/inspection/cutting/CuttingMeasurementPointsModify";
import CuttingOrderModify from "../components/inspection/cutting/CuttingOrderModify";
import MeasurementTable from "../components/inspection/cutting/MeasurementTable";
import CuttingReportQCView from "../components/inspection/cutting/report/CuttingReportQCView";

import { useSearchParams } from "react-router-dom";

const CuttingPage = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [tableNo, setTableNo] = useState("");
  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const tableNoDropdownRef = useRef(null);
  const [cutPanelData, setCutPanelData] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [aggregatedTotalOrderQty, setAggregatedTotalOrderQty] = useState(null);

  // New state variables
  const [inspectionProgress, setInspectionProgress] = useState(null);
  const [inspectedSizes, setInspectedSizes] = useState([]);
  const [bundleQtyError, setBundleQtyError] = useState("");

  const [planLayerQty, setPlanLayerQty] = useState(0);
  const [totalPlanPcs, setTotalPlanPcs] = useState(0);
  const [actualLayers, setActualLayers] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const [totalBundleQty, setTotalBundleQty] = useState("");
  const [bundleQtyCheck, setBundleQtyCheck] = useState("");
  const [totalInspectionQty, setTotalInspectionQty] = useState(0);
  const [cuttingByAuto, setCuttingByAuto] = useState(true);
  const [cuttingByManual, setCuttingByManual] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [showBundleQtyCheckNumberPad, setShowBundleQtyCheckNumberPad] =
    useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showTotalInspectionQtyNumberPad, setShowTotalInspectionQtyNumberPad] =
    useState(false);
  const [isTotalInspectionQtyManual, setIsTotalInspectionQtyManual] =
    useState(false);
  const [selectedPanel, setSelectedPanel] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSerialLetter, setSelectedSerialLetter] = useState("");
  const [bundleQty, setBundleQty] = useState("");
  const [bundleTableData, setBundleTableData] = useState([]);
  const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 });
  const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top");
  const [colCounts, setColCounts] = useState([]);
  const [panels, setPanels] = useState([]);
  const [panelIndexNames, setPanelIndexNames] = useState([]);
  const [summary, setSummary] = useState({
    Top: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    },
    Middle: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    },
    Bottom: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0,
      bundles: []
    }
  });
  const [tableData, setTableData] = useState([]);
  const [columnDefects, setColumnDefects] = useState([]);
  const [filters, setFilters] = useState({
    panelName: "",
    side: "",
    direction: "",
    lw: ""
  });
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [fabricDefects, setFabricDefects] = useState([]);
  const [aqlDetails, setAQLDetails] = useState(null);

  const [searchParams] = useSearchParams();

  const cuttingIssuesRef = useRef(null); // Ref for CuttingIssues component

  useEffect(() => {
    const notifMoNo = searchParams.get("moNo");
    const notifTableNo = searchParams.get("tableNo");

    // If these params exist, force the tab to 'report'
    if (notifMoNo && notifTableNo) {
      setActiveTab("report");
    }
  }, [searchParams]);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTabletDevice =
      /ipad|android|tablet|kindle|playbook|silk/.test(userAgent) ||
      (userAgent.includes("mobile") && !userAgent.includes("phone"));
    setIsTablet(isTabletDevice);
  }, []);

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-mo-numbers`,
          {
            params: { search: moNoSearch },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchMONumbers")
        });
      }
    };
    fetchMoNumbers();
  }, [moNoSearch, t]);

  // Add this useEffect to fetch aggregated total order quantity
  useEffect(() => {
    const fetchAggregatedTotalOrderQty = async () => {
      if (!moNo) {
        setAggregatedTotalOrderQty(null);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders/aggregated-total-order-qty`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setAggregatedTotalOrderQty(response.data.aggregatedTotalOrderQty);
      } catch (error) {
        console.error("Error fetching aggregated total order quantity:", error);
        setAggregatedTotalOrderQty(null); // Or set to 0 or show an error
        // Optionally, show a user-facing error, but for now, just log it.
      }
    };

    fetchAggregatedTotalOrderQty();
  }, [moNo]); // Re-fetch when moNo changes

  useEffect(() => {
    const fetchTableNoOptions = async () => {
      if (!moNo) {
        setTableNoOptions([]);
        setTableNoSearch(""); // Also clear search if moNo is cleared
        setTableNo(""); // And the selected tableNo
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setTableNoOptions(response.data);
      } catch (error) {
        console.error("Error fetching Table Nos:", error);
        setTableNoOptions([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchTableNos")
        });
      }
    };
    fetchTableNoOptions();
  }, [moNo, t]);

  // useEffect to reset cutPanelData and other dependent states when moNo or tableNo changes
  useEffect(() => {
    if (!moNo || !tableNo) {
      setCutPanelData(null);
      setAvailableSizes([]);
      setPlanLayerQty(0);
      setTotalPlanPcs(0);
      setActualLayers(0);
      // Potentially reset other states that depend on cutPanelData
    }
    // If moNo changes but tableNo is not yet selected (or reset),
    // cutPanelData should also be null.
    if (!tableNo) {
      setCutPanelData(null);
    }
  }, [moNo, tableNo]);

  useEffect(() => {
    const fetchCutPanelData = async () => {
      if (!moNo || !tableNo) {
        setCutPanelData(null);
        setAvailableSizes([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutpanel-orders-details`,
          {
            params: { styleNo: moNo, tableNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setCutPanelData(response.data);
        const sizes = response.data.MarkerRatio.filter(
          (mr) =>
            mr.cuttingRatio !== null &&
            mr.cuttingRatio !== "" &&
            mr.cuttingRatio > 0
        ).map((mr) => mr.size);
        setAvailableSizes([...new Set(sizes)]);
        setPlanLayerQty(response.data.PlanLayer || 0);
        setTotalPlanPcs(response.data.TotalPcs || 0);
        setActualLayers(response.data.ActualLayer || 0);
      } catch (error) {
        console.error("Error fetching Cut Panel data:", error);
        setCutPanelData(null);
        setAvailableSizes([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchCutPanelData")
        });
      }
    };
    fetchCutPanelData();
  }, [moNo, tableNo, t]);

  // Fetch inspection progress when moNo, tableNo, and selectedPanel change
  useEffect(() => {
    const fetchInspectionProgress = async () => {
      if (!moNo || !tableNo || !selectedPanel) {
        setInspectionProgress(null);
        setInspectedSizes([]);
        setBundleQtyError("");
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspection-progress`,
          {
            params: { moNo, tableNo, garmentType: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setInspectionProgress(response.data.progress);
        setInspectedSizes(response.data.inspectedSizes || []);
      } catch (error) {
        console.error("Error fetching inspection progress:", error);
        setInspectionProgress(null);
        setInspectedSizes([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchInspectionProgress")
        });
      }
    };
    fetchInspectionProgress();
  }, [moNo, tableNo, selectedPanel, t]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (totalBundleQty && (actualLayers || planLayerQty)) {
      const layersToUse = actualLayers || planLayerQty;
      const multiplication = parseInt(totalBundleQty) * layersToUse;
      let calculatedBundleQtyCheck;
      if (multiplication >= 1 && multiplication <= 150)
        calculatedBundleQtyCheck = 2;
      else if (multiplication >= 151 && multiplication <= 280)
        calculatedBundleQtyCheck = 3;
      else if (multiplication >= 281 && multiplication <= 500)
        calculatedBundleQtyCheck = 4;
      else if (multiplication >= 501 && multiplication <= 1200)
        calculatedBundleQtyCheck = 6;
      else if (multiplication >= 1201 && multiplication <= 3200)
        calculatedBundleQtyCheck = 9;
      else if (multiplication >= 3201 && multiplication <= 10000)
        calculatedBundleQtyCheck = 14;
      else if (multiplication >= 10001 && multiplication <= 35000)
        calculatedBundleQtyCheck = 21;
      else calculatedBundleQtyCheck = "";
      setBundleQtyCheck(calculatedBundleQtyCheck.toString());
      if (!isTotalInspectionQtyManual)
        setTotalInspectionQty(calculatedBundleQtyCheck * 15);

      // Fetch AQL details
      const fetchAQLDetails = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/aql-details`, {
            params: { lotSize: multiplication },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          });
          setAQLDetails(response.data);
        } catch (error) {
          console.error("Error fetching AQL details:", error);
          setAQLDetails(null);
        }
      };
      fetchAQLDetails();
    } else {
      setBundleQtyCheck("");
      if (!isTotalInspectionQtyManual) setTotalInspectionQty(0);
    }
  }, [totalBundleQty, actualLayers, planLayerQty, isTotalInspectionQtyManual]);

  useEffect(() => {
    if (bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
    } else if (!bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(0);
    }
  }, [bundleQtyCheck, isTotalInspectionQtyManual]);

  useEffect(() => {
    const newBundleQty = parseInt(bundleQty) || 0;
    const newTableData = Array.from({ length: newBundleQty }, () => ({
      Top: [],
      Middle: [],
      Bottom: []
    }));
    const newColCounts = Array.from({ length: newBundleQty }, () => ({
      Top: 5,
      Middle: 5,
      Bottom: 5
    }));
    const newColumnDefects = Array.from({ length: newBundleQty }, () => ({
      Top: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Middle: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Bottom: Array(5)
        .fill([])
        .map(() => Array(5).fill([]))
    }));
    setTableData(newTableData);
    setColCounts(newColCounts);
    setColumnDefects(newColumnDefects);
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      }
    });
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  }, [bundleQty, selectedPanel]);

  useEffect(() => {
    const newColCounts = bundleTableData.map((row) => ({
      Top: parseInt(row.tValue) || 5,
      Middle: parseInt(row.mValue) || 5,
      Bottom: parseInt(row.bValue) || 5
    }));

    // Only update colCounts if they actually changed
    if (JSON.stringify(colCounts) !== JSON.stringify(newColCounts)) {
      setColCounts(newColCounts);
    }

    // Adapt tableData (measurement values) for column count changes
    setTableData((prevTableData) => {
      return prevTableData.map((bundleData, bundleIdx) => {
        const currentBundleData = bundleData || {
          Top: [],
          Middle: [],
          Bottom: []
        };
        const updatedBundleData = { ...currentBundleData };

        ["Top", "Middle", "Bottom"].forEach((tab) => {
          const currentTabData = currentBundleData[tab] || [];
          const targetColCount = newColCounts[bundleIdx]?.[tab] || 5;

          updatedBundleData[tab] = currentTabData.map((row) => {
            if (row.values.length !== targetColCount) {
              const newValues = Array(targetColCount).fill({
                decimal: 0,
                fraction: "0"
              });
              for (
                let i = 0;
                i < Math.min(row.values.length, targetColCount);
                i++
              ) {
                newValues[i] = row.values[i];
              }
              return { ...row, values: newValues };
            }
            return row;
          });
        });
        return updatedBundleData;
      });
    });

    // Adapt columnDefects for column count changes
    setColumnDefects((prevColumnDefects) => {
      return prevColumnDefects.map((bundleDefects, bundleIdx) => {
        const currentBundleDefects = bundleDefects || {
          Top: [],
          Middle: [],
          Bottom: []
        };
        const updatedBundleDefects = { ...currentBundleDefects };
        const maxPanelIndexForCurrentPanel = Math.max(
          1,
          ...measurementPoints
            .filter((mp) => mp.panel === selectedPanel)
            .map((mp) => mp.panelIndex)
        );

        ["Top", "Middle", "Bottom"].forEach((tab) => {
          const currentTabDefects = currentBundleDefects[tab] || [];
          const targetColCount = newColCounts[bundleIdx]?.[tab] || 5;
          let newTabDefects = JSON.parse(JSON.stringify(currentTabDefects)); // Deep copy

          // Adjust number of columns
          if (newTabDefects.length > targetColCount) {
            newTabDefects = newTabDefects.slice(0, targetColCount);
          } else if (newTabDefects.length < targetColCount) {
            for (let i = newTabDefects.length; i < targetColCount; i++) {
              newTabDefects.push(
                Array(maxPanelIndexForCurrentPanel)
                  .fill(null)
                  .map(() => [])
              );
            }
          }

          // Ensure each column has the correct number of panel index arrays
          newTabDefects = newTabDefects.map((colArray) => {
            let newColArray = Array.isArray(colArray)
              ? [...colArray]
              : Array(maxPanelIndexForCurrentPanel)
                  .fill(null)
                  .map(() => []);
            if (newColArray.length > maxPanelIndexForCurrentPanel) {
              newColArray = newColArray.slice(0, maxPanelIndexForCurrentPanel);
            } else if (newColArray.length < maxPanelIndexForCurrentPanel) {
              for (
                let i = newColArray.length;
                i < maxPanelIndexForCurrentPanel;
                i++
              ) {
                newColArray.push([]);
              }
            }
            return newColArray;
          });
          updatedBundleDefects[tab] = newTabDefects;
        });
        return updatedBundleDefects;
      });
    });
  }, [bundleTableData, selectedPanel, measurementPoints, colCounts]); // Added dependencies

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panels`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setPanels(response.data);
      } catch (error) {
        console.error("Error fetching panels:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchPanels")
        });
      }
    };
    fetchPanels();
  }, [t]);

  useEffect(() => {
    const fetchPanelIndexNames = async () => {
      if (!moNo || !selectedPanel) {
        setPanelIndexNames([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-panel-index-names-by-mo`,
          {
            params: { moNo, panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Log the actual data received from the API
        console.log("Fetched panelIndexNames data:", response.data);
        setPanelIndexNames(response.data);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
        setPanelIndexNames([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchPanelIndexNames")
        });
      }
    };
    fetchPanelIndexNames();
  }, [moNo, selectedPanel, i18n.language, t]);

  useEffect(() => {
    const fetchMeasurementPoints = async () => {
      if (!moNo || !selectedPanel) {
        setMeasurementPoints([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          {
            params: { moNo, panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Fetch Common measurement points
        const commonResponse = await axios.get(
          `${API_BASE_URL}/api/cutting-measurement-points`,
          {
            params: { moNo: "Common", panel: selectedPanel },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        // Combine and deduplicate measurement points, prioritizing specific moNo
        const combinedPoints = [...response.data];
        commonResponse.data.forEach((commonPoint) => {
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
        console.error("Error fetching measurement points:", error);
        setMeasurementPoints([]);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchMeasurementPoints")
        });
      }
    };
    fetchMeasurementPoints();
  }, [moNo, selectedPanel, t]);

  // Add this useEffect after other useEffects (e.g., after fetchMeasurementPoints)
  useEffect(() => {
    const fetchFabricDefects = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-fabric-defects`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setFabricDefects(response.data);
      } catch (error) {
        console.error("Error fetching fabric defects:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cutting.failedToFetchDefects")
        });
      }
    };
    fetchFabricDefects();
  }, [t]); // Dependency on t for translation updates

  const resetForm = () => {
    setMoNo("");
    setMoNoSearch("");
    setMoNoOptions([]);
    setShowMoNoDropdown(false);
    setTableNo("");
    setTableNoSearch("");
    setTableNoOptions([]);
    setShowTableNoDropdown(false);
    setCutPanelData(null);
    setAvailableSizes([]);
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setTotalBundleQty("");
    setBundleQtyCheck("");
    setTotalInspectionQty(0);
    setCuttingByAuto(true);
    setCuttingByManual(false);
    setSelectedPanel("");
    setSelectedSize("");
    setSelectedSerialLetter("");
    setShowOrderDetails(true);
    setTolerance({ min: -0.125, max: 0.125 });
    setActiveMeasurementTab("Top");
    setColCounts([]);
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: []
      }
    });
    setTableData([]);
    setColumnDefects([]);
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
    setInspectionProgress(null); // Reset progress
    setInspectedSizes([]); // Reset inspected sizes
    setBundleQtyError(""); // Reset bundle qty error
  };

  const resetMeasurementData = () => {
    const newBundleQty = parseInt(bundleQty) || 0;
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0,
        bundles: Array(newBundleQty).fill(null)
      }
    });
    setTableData(
      Array.from({ length: newBundleQty }, () => ({
        Top: [],
        Middle: [],
        Bottom: []
      }))
    );
    setColumnDefects(
      Array.from({ length: newBundleQty }, (_, i) => ({
        Top: Array(colCounts[i]?.Top || 5)
          .fill([])
          .map(() => Array(5).fill([])),
        Middle: Array(colCounts[i]?.Middle || 5)
          .fill([])
          .map(() => Array(5).fill([])),
        Bottom: Array(colCounts[i]?.Bottom || 5)
          .fill([])
          .map(() => Array(5).fill([]))
      }))
    );
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  };

  const collectMeasurementData = (
    tab,
    bundleIndex,
    tableDataTab,
    defectsTab,
    tolerance,
    numColumns
  ) => {
    const usedPanelIndices = [
      ...new Set(
        tableDataTab.filter((row) => row.isUsed).map((row) => row.panelIndex)
      )
    ];
    return usedPanelIndices.map((panelIndex) => {
      let totalMeasurementDefects = 0;
      let totalDefectPcs = 0;
      for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        const hasMeasurementDefect = tableDataTab
          .filter((row) => row.panelIndex === panelIndex && row.isUsed)
          .some((row) => {
            const value = row.values[colIndex].decimal;
            return (
              value !== null && (value < tolerance.min || value > tolerance.max)
            );
          });
        if (hasMeasurementDefect) totalMeasurementDefects++;
        const hasDefects = defectsTab[colIndex][panelIndex - 1].length > 0;
        if (hasDefects) totalDefectPcs++;
      }
      return {
        bundleNo: bundleIndex + 1,
        panelIndex,
        totalMeasurementDefects,
        totalDefectPcs,
        measurementPointData: tableDataTab
          .filter((row) => row.panelIndex === panelIndex && row.isUsed)
          .map((row) => ({
            no: row.no,
            measurementPointName: row.measurementPoint,
            panelName: row.panelName,
            side: row.panelSide,
            direction: row.panelDirection,
            property: row.measurementSide,
            measurementValues: row.values.map((value, colIndex) => ({
              partName: `${tab[0]}${colIndex + 1}`,
              measurement: value.decimal,
              status:
                value.decimal !== null &&
                (value.decimal < tolerance.min || value.decimal > tolerance.max)
                  ? "Fail"
                  : "Pass"
            }))
          })),
        defectData: Array.from({ length: numColumns }, (_, colIndex) => ({
          column: `${tab[0]}${colIndex + 1}`,
          defects: defectsTab[colIndex][panelIndex - 1].map((d) => ({
            defectName: d.defectName,
            defectQty: d.count
          }))
        }))
      };
    });
  };

  // Helper function to determine if a checkbox should be disabled
  const isPartCheckboxDisabled = (bundleRow, currentPartName) => {
    // bundleRow.parts is an array of selected part names for this bundle
    if (
      bundleRow.parts.length === 1 &&
      !bundleRow.parts.includes(currentPartName)
    ) {
      return true; // Disable if one part is selected AND it's not the current part's checkbox
    }
    return false; // Otherwise, enable
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !moNo ||
      !tableNo ||
      !totalBundleQty ||
      !bundleQtyCheck ||
      !selectedPanel ||
      !selectedSize ||
      !bundleQty
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFields")
      });
      return;
    }

    // Calculate total parts based on bundleTableData
    const totalPcsSize = bundleTableData.reduce((acc, bundle) => {
      const numParts = bundle.parts.length;
      const tValue = parseInt(bundle.tValue) || 5;
      const mValue = parseInt(bundle.mValue) || 5;
      const bValue = parseInt(bundle.bValue) || 5;
      return acc + numParts * (tValue + mValue + bValue);
    }, 0);

    const pcsSize = {
      total: totalPcsSize,
      top: bundleTableData.reduce(
        (acc, bundle) =>
          acc + bundle.parts.length * (parseInt(bundle.tValue) || 5),
        0
      ),
      middle: bundleTableData.reduce(
        (acc, bundle) =>
          acc + bundle.parts.length * (parseInt(bundle.mValue) || 5),
        0
      ),
      bottom: bundleTableData.reduce(
        (acc, bundle) =>
          acc + bundle.parts.length * (parseInt(bundle.bValue) || 5),
        0
      )
    };

    const totalReject =
      summary.Top.totalReject +
      summary.Middle.totalReject +
      summary.Bottom.totalReject;

    const rejectSize = {
      total: totalReject,
      top: summary.Top.totalReject,
      middle: summary.Middle.totalReject,
      bottom: summary.Bottom.totalReject
    };

    // Calculate passSize as pcsSize - rejectSize
    const passSize = {
      total: totalPcsSize - totalReject,
      top: pcsSize.top - summary.Top.totalReject,
      middle: pcsSize.middle - summary.Middle.totalReject,
      bottom: pcsSize.bottom - summary.Bottom.totalReject
    };

    if (!totalPcsSize || !bundleTableData.length) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.invalidData"),
        text: t("cutting.missingInspectionData")
      });
      return;
    }

    let cuttingtype = "";
    if (cuttingByAuto && cuttingByManual) cuttingtype = "Auto & Manual";
    else if (cuttingByAuto) cuttingtype = "Auto";
    else if (cuttingByManual) cuttingtype = "Manual";
    else cuttingtype = "None";

    const cuttingIssuesData = cuttingIssuesRef.current.getIssuesData();

    const inspectionData = {
      inspectedSize: selectedSize,
      bundleQtyCheckSize: parseInt(bundleQty),
      tolerance,
      totalPcsSize, // Now calculated from bundleTableData
      pcsSize, // Detailed breakdown by Top, Middle, Bottom
      passSize,
      rejectSize,
      rejectGarmentSize: {
        total:
          summary.Top.rejectDefects +
          summary.Middle.rejectDefects +
          summary.Bottom.rejectDefects,
        top: summary.Top.rejectDefects,
        middle: summary.Middle.rejectDefects,
        bottom: summary.Bottom.rejectDefects
      },

      rejectMeasurementSize: {
        total:
          summary.Top.rejectMeasurement +
          summary.Middle.rejectMeasurement +
          summary.Bottom.rejectMeasurement,
        top: summary.Top.rejectMeasurement,
        middle: summary.Middle.rejectMeasurement,
        bottom: summary.Bottom.rejectMeasurement
      },
      passrateSize: {
        total:
          totalPcsSize > 0
            ? parseFloat(((passSize.total / totalPcsSize) * 100).toFixed(2))
            : 0,
        top:
          pcsSize.top > 0
            ? parseFloat(((passSize.top / pcsSize.top) * 100).toFixed(2))
            : 0,
        middle:
          pcsSize.middle > 0
            ? parseFloat(((passSize.middle / pcsSize.middle) * 100).toFixed(2))
            : 0,
        bottom:
          pcsSize.bottom > 0
            ? parseFloat(((passSize.bottom / pcsSize.bottom) * 100).toFixed(2))
            : 0
      },

      bundleInspectionData: bundleTableData.map((bundle, bundleIndex) => ({
        bundleNo: bundle.bundleNo,
        serialLetter: bundle.serialLetter,
        totalPcs: calculateTotalPcs(bundle),
        pcs: {
          total: calculateTotalPcs(bundle),
          top: bundle.parts.length * (parseInt(bundle.tValue) || 5),
          middle: bundle.parts.length * (parseInt(bundle.mValue) || 5),
          bottom: bundle.parts.length * (parseInt(bundle.bValue) || 5)
        },
        pass: {
          total:
            calculateTotalPcs(bundle) -
            (summary.Top.bundles[bundleIndex]?.totalReject || 0) -
            (summary.Middle.bundles[bundleIndex]?.totalReject || 0) -
            (summary.Bottom.bundles[bundleIndex]?.totalReject || 0),
          top:
            bundle.parts.length * (parseInt(bundle.tValue) || 5) -
            (summary.Top.bundles[bundleIndex]?.totalReject || 0),
          middle:
            bundle.parts.length * (parseInt(bundle.mValue) || 5) -
            (summary.Middle.bundles[bundleIndex]?.totalReject || 0),
          bottom:
            bundle.parts.length * (parseInt(bundle.bValue) || 5) -
            (summary.Bottom.bundles[bundleIndex]?.totalReject || 0)
        },
        reject: {
          total:
            (summary.Top.bundles[bundleIndex]?.totalReject || 0) +
            (summary.Middle.bundles[bundleIndex]?.totalReject || 0) +
            (summary.Bottom.bundles[bundleIndex]?.totalReject || 0),
          top: summary.Top.bundles[bundleIndex]?.totalReject || 0,
          middle: summary.Middle.bundles[bundleIndex]?.totalReject || 0,
          bottom: summary.Bottom.bundles[bundleIndex]?.totalReject || 0
        },
        rejectGarment: {
          total:
            (summary.Top.bundles[bundleIndex]?.rejectDefects || 0) +
            (summary.Middle.bundles[bundleIndex]?.rejectDefects || 0) +
            (summary.Bottom.bundles[bundleIndex]?.rejectDefects || 0),
          top: summary.Top.bundles[bundleIndex]?.rejectDefects || 0,
          middle: summary.Middle.bundles[bundleIndex]?.rejectDefects || 0,
          bottom: summary.Bottom.bundles[bundleIndex]?.rejectDefects || 0
        },

        rejectMeasurement: {
          total:
            (summary.Top.bundles[bundleIndex]?.rejectMeasurement || 0) +
            (summary.Middle.bundles[bundleIndex]?.rejectMeasurement || 0) +
            (summary.Bottom.bundles[bundleIndex]?.rejectMeasurement || 0),
          top: summary.Top.bundles[bundleIndex]?.rejectMeasurement || 0,
          middle: summary.Middle.bundles[bundleIndex]?.rejectMeasurement || 0,
          bottom: summary.Bottom.bundles[bundleIndex]?.rejectMeasurement || 0
        },
        passrate: {
          total:
            calculateTotalPcs(bundle) > 0
              ? parseFloat(
                  (
                    ((calculateTotalPcs(bundle) -
                      ((summary.Top.bundles[bundleIndex]?.totalReject || 0) +
                        (summary.Middle.bundles[bundleIndex]?.totalReject ||
                          0) +
                        (summary.Bottom.bundles[bundleIndex]?.totalReject ||
                          0))) /
                      calculateTotalPcs(bundle)) *
                    100
                  ).toFixed(2)
                )
              : 0,
          top:
            bundle.parts.length * (parseInt(bundle.tValue) || 5) > 0
              ? parseFloat(
                  (
                    ((bundle.parts.length * (parseInt(bundle.tValue) || 5) -
                      (summary.Top.bundles[bundleIndex]?.totalReject || 0)) /
                      (bundle.parts.length * (parseInt(bundle.tValue) || 5))) *
                    100
                  ).toFixed(2)
                )
              : 0,
          middle:
            bundle.parts.length * (parseInt(bundle.mValue) || 5) > 0
              ? parseFloat(
                  (
                    ((bundle.parts.length * (parseInt(bundle.mValue) || 5) -
                      (summary.Middle.bundles[bundleIndex]?.totalReject || 0)) /
                      (bundle.parts.length * (parseInt(bundle.mValue) || 5))) *
                    100
                  ).toFixed(2)
                )
              : 0,
          bottom:
            bundle.parts.length * (parseInt(bundle.bValue) || 5) > 0
              ? parseFloat(
                  (
                    ((bundle.parts.length * (parseInt(bundle.bValue) || 5) -
                      (summary.Bottom.bundles[bundleIndex]?.totalReject || 0)) /
                      (bundle.parts.length * (parseInt(bundle.bValue) || 5))) *
                    100
                  ).toFixed(2)
                )
              : 0
        },
        measurementInsepctionData: bundle.parts.map((partName) => {
          const partInfo = panelIndexNames.find(
            (p) => p.panelIndexName === partName
          );
          return {
            partName,
            partNo: partInfo?.panelIndex || 0,
            partNameKhmer: partInfo?.panelIndexNameKhmer || "",
            measurementPointsData: measurementPoints
              .filter((mp) => mp.panelIndexName === partName)
              .map((mp) => ({
                measurementPointName: mp.pointNameEng,
                measurementPointNameKhmer: mp.pointNameKhmer,
                panelName: mp.panelName,
                side: mp.panelSide,
                direction: mp.panelDirection,
                property: mp.measurementSide,
                measurementValues: ["Top", "Middle", "Bottom"].map(
                  (location) => ({
                    location,
                    measurements: (tableData[bundleIndex]?.[location] || [])
                      .filter(
                        (row) =>
                          row.measurementPoint === mp.pointNameEng && row.isUsed
                      )
                      .flatMap((row) =>
                        row.values.map((val, idx) => ({
                          pcsName: `${location[0]}${idx + 1}`,
                          valuedecimal: val.decimal,
                          valuefraction: val.fraction,
                          status:
                            val.decimal < tolerance.min ||
                            val.decimal > tolerance.max
                              ? "Fail"
                              : "Pass"
                        }))
                      )
                  })
                )
              })),
            fabricDefects: ["Top", "Middle", "Bottom"].map((location) => {
              // Determine number of pieces for this location (e.g., T1 to T5)
              const pcsCount =
                (tableData[bundleIndex]?.[location] || [])
                  .filter((row) => row.isUsed)
                  .reduce((max, row) => Math.max(max, row.values.length), 0) ||
                5; // Default to 5 if no data
              const defectData = Array.from(
                { length: pcsCount },
                (_, colIdx) => {
                  // Get defects array for this piece, handling nested structure
                  const defectsArray =
                    (columnDefects[bundleIndex]?.[location] || [])[colIdx] ||
                    [];
                  // Filter valid defects from the defects array
                  const validDefects = defectsArray
                    .flat()
                    .filter(
                      (d) =>
                        d &&
                        typeof d === "object" &&
                        d.defectName &&
                        typeof d.defectName === "string" &&
                        d.defectName.trim() !== "" &&
                        d.count != null &&
                        Number(d.count) > 0
                    );
                  return {
                    pcsName: `${location[0]}${colIdx + 1}`,
                    totalDefects: validDefects.reduce(
                      (sum, d) => sum + Number(d.count),
                      0
                    ),
                    defects: validDefects.map((d) => ({
                      defectName: d.defectName.trim(),
                      defectQty: Number(d.count)
                    }))
                  };
                }
              );
              return {
                location,
                defectData
              };
            })
          };
        })
      })),

      cuttingDefects: {
        issues: cuttingIssuesData.issues,
        additionalComments: cuttingIssuesData.additionalComments,
        additionalImages: cuttingIssuesData.additionalImages
      },
      inspectionTime: new Date().toLocaleTimeString("en-US", { hour12: false }),
      created_at: new Date(), // Add timestamps to inspectionData
      updated_at: new Date()
    };

    const report = {
      inspectionDate: inspectionDate.toLocaleDateString("en-US"),
      cutting_emp_id: user.emp_id,
      cutting_emp_engName: user.eng_name,
      cutting_emp_khName: user.kh_name,
      cutting_emp_dept: user.dept_name,
      cutting_emp_section: user.sect_name,
      moNo,
      tableNo,
      buyerStyle: cutPanelData?.BuyerStyle || "",
      buyer: cutPanelData?.Buyer || "",
      color: cutPanelData?.Color || "",
      lotNo: cutPanelData?.LotNos || [],
      orderQty: cutPanelData?.TotalOrderQty || 0,
      totalOrderQtyStyle:
        aggregatedTotalOrderQty !== null
          ? aggregatedTotalOrderQty
          : cutPanelData?.TotalOrderQty || 0, // <<<--- ADD THIS LINE
      fabricDetails: {
        fabricType: cutPanelData?.FabricType || "",
        material: cutPanelData?.Material || "",
        rollQty: cutPanelData?.RollQty || 0,
        spreadYds: cutPanelData?.SpreadYds || 0,
        unit: cutPanelData?.Unit || "",
        grossKgs: cutPanelData?.GrossKgs || 0,
        netKgs: cutPanelData?.NetKgs || 0,
        totalTTLRoll: cutPanelData?.TotalTTLRoll || 0
      },
      cuttingTableDetails: {
        spreadTable: cutPanelData?.SpreadTable || "",
        spreadTableNo: tableNo.replace(/^T\s*/, ""), // Remove leading "T" and spaces,
        planLayers: planLayerQty,
        actualLayers: actualLayers,
        totalPcs: totalPlanPcs,
        mackerNo: cutPanelData?.MackerNo || "",
        mackerLength: cutPanelData?.MackerLength || 0
      },
      mackerRatio:
        cutPanelData?.MarkerRatio.filter(
          (mr) =>
            mr.cuttingRatio !== null &&
            mr.cuttingRatio !== 0 &&
            mr.cuttingRatio !== ""
        ).map((data, index) => ({
          index: index + 1,
          markerSize: data.size,
          ratio: data.cuttingRatio
        })) || [],
      totalBundleQty: parseInt(totalBundleQty),
      bundleQtyCheck: parseInt(bundleQtyCheck),
      totalInspectionQty,
      cuttingtype,
      garmentType: selectedPanel,
      inspectionData: [inspectionData] // Wrap in array as schema expects an array
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/save-cutting-inspection`,
        report,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true // Add for CORS/auth
        }
      );
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });

      // Reset form and refresh inspected sizes
      setSelectedSize("");
      setBundleQty("");
      setBundleTableData([]);
      setTableData([]);
      setColumnDefects([]);
      setSummary({
        Top: {
          totalParts: 0,
          totalPass: 0,
          totalReject: 0,
          rejectMeasurement: 0,
          rejectDefects: 0,
          passRate: 0,
          bundles: []
        },
        Middle: {
          totalParts: 0,
          totalPass: 0,
          totalReject: 0,
          rejectMeasurement: 0,
          rejectDefects: 0,
          passRate: 0,
          bundles: []
        },
        Bottom: {
          totalParts: 0,
          totalPass: 0,
          totalReject: 0,
          rejectMeasurement: 0,
          rejectDefects: 0,
          passRate: 0,
          bundles: []
        }
      });
      setActiveMeasurementTab("Top");
      setFilters({ panelName: "", side: "", direction: "", lw: "" });
      setBundleQtyError("");

      // Refresh inspected sizes
      const progressResponse = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-progress`,
        {
          params: { moNo, tableNo, garmentType: selectedPanel },
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );
      setInspectedSizes(progressResponse.data.inspectedSizes || []);
      setInspectionProgress(progressResponse.data.progress);
    } catch (error) {
      console.error("Error saving Cutting data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: error.response?.data?.message || t("cutting.failedToSaveData")
      });
    }
  };

  const filteredMeasurementPoints = measurementPoints.filter(
    (point) => point.panel === selectedPanel
  );
  const serialLetters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const toleranceOptions = [
    { label: "-1/16, 1/16", value: { min: -0.0625, max: 0.0625 } },
    { label: "-1/8, 1/8", value: { min: -0.125, max: 0.125 } }
  ];

  const handleToleranceChange = (e) => {
    const selectedOption = toleranceOptions.find(
      (option) => option.label === e.target.value
    );
    if (selectedOption) setTolerance(selectedOption.value);
  };

  const calculateTotalPcs = (row) => {
    const numParts = row.parts.length;
    const tValue = parseInt(row.tValue) || 5; // Default to 5 if not set
    const mValue = parseInt(row.mValue) || 5;
    const bValue = parseInt(row.bValue) || 5;
    return numParts > 0 ? numParts * (tValue + mValue + bValue) : 0;
  };

  const handleColChange = (bundleIndex, tab, value) => {
    const bundle = bundleTableData[bundleIndex];
    if (bundle.parts.length > 0) return; // Prevent state update if parts selected
    const newCount = parseInt(value);
    setColCounts((prev) => {
      const newColCounts = [...prev];
      newColCounts[bundleIndex] = {
        ...newColCounts[bundleIndex],
        [tab]: newCount
      };
      return newColCounts;
    });
    setColumnDefects((prev) => {
      const newDefects = [...prev];
      newDefects[bundleIndex][tab] = Array(newCount)
        .fill([])
        .map(() => Array(5).fill([]));
      return newDefects;
    });
  };

  const updateSummary = React.useCallback(
    (tab, data, bundleIndex) => {
      setSummary((prev) => {
        const newSummary = { ...prev };
        // Ensure bundles array exists and has correct length
        const expectedBundleLength = parseInt(bundleQty) || 0;
        if (
          !newSummary[tab].bundles ||
          newSummary[tab].bundles.length !== expectedBundleLength
        ) {
          newSummary[tab].bundles = Array(expectedBundleLength).fill(null);
        }

        newSummary[tab].bundles[bundleIndex] = data;

        const totalParts = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalParts || 0),
          0
        );
        const totalPass = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalPass || 0),
          0
        );
        const totalReject = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.totalReject || 0),
          0
        );
        const rejectMeasurement = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.rejectMeasurement || 0),
          0
        );
        const rejectDefects = newSummary[tab].bundles.reduce(
          (acc, curr) => acc + (curr?.rejectDefects || 0),
          0
        );
        const passRate =
          totalParts > 0 ? ((totalPass / totalParts) * 100).toFixed(2) : 0;
        newSummary[tab] = {
          totalParts,
          totalPass,
          totalReject,
          rejectMeasurement,
          rejectDefects,
          passRate,
          bundles: newSummary[tab].bundles
        };
        return newSummary;
      });
    },
    [bundleQty]
  ); // bundleQty is needed if it determines the structure of summary.bundles

  const updateTableData = React.useCallback((bundleIndex, tab, data) => {
    setTableData((prev) => {
      const newData = [...prev];
      // Ensure the bundle entry exists
      if (!newData[bundleIndex]) {
        newData[bundleIndex] = { Top: [], Middle: [], Bottom: [] };
      }
      newData[bundleIndex] = { ...newData[bundleIndex], [tab]: data };
      return newData;
    });
  }, []); // setTableData is stable

  const updateDefects = React.useCallback(
    (bundleIndex, tab, newDefects) => {
      setColumnDefects((prev) => {
        const newDefectsData = [...prev];
        // Ensure the bundle entry exists
        if (!newDefectsData[bundleIndex]) {
          // Initialize with a structure that matches colCounts and panel indices
          const currentBundleColCounts = colCounts[bundleIndex] || {
            Top: 5,
            Middle: 5,
            Bottom: 5
          };
          const maxPanelIdx = Math.max(
            1,
            ...measurementPoints
              .filter((mp) => mp.panel === selectedPanel)
              .map((mp) => mp.panelIndex)
          );
          newDefectsData[bundleIndex] = {
            Top: Array(currentBundleColCounts.Top)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([])),
            Middle: Array(currentBundleColCounts.Middle)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([])),
            Bottom: Array(currentBundleColCounts.Bottom)
              .fill(null)
              .map(() => Array(maxPanelIdx).fill([]))
          };
        }
        newDefectsData[bundleIndex] = {
          ...newDefectsData[bundleIndex],
          [tab]: newDefects
        };
        return newDefectsData;
      });
    },
    [colCounts, measurementPoints, selectedPanel]
  ); // Dependencies for initializing defect structure

  const totalParts =
    summary.Top.totalParts +
    summary.Middle.totalParts +
    summary.Bottom.totalParts;
  const totalPass =
    summary.Top.totalPass + summary.Middle.totalPass + summary.Bottom.totalPass;
  const totalReject =
    summary.Top.totalReject +
    summary.Middle.totalReject +
    summary.Bottom.totalReject;

  const uniqueOptions = (key) => [
    ...new Set(measurementPoints.map((point) => point[key]).filter(Boolean))
  ];

  if (authLoading) return <div>{t("cutting.loading")}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {t("cutting.cutting_inspection")}
        </h1>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 ${
              activeTab === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-lg`}
          >
            {t("cutting.cuttingForm")}
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 ${
              activeTab === "data"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.data")}
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 ${
              activeTab === "report"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.report")}
          </button>
          <button
            onClick={() => setActiveTab("Modify")}
            className={`px-4 py-2 ${
              activeTab === "Modify"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.modify")}
          </button>
          <button
            onClick={() => setActiveTab("Adding")}
            className={`px-4 py-2 ${
              activeTab === "Adding"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("cutting.adding")}
          </button>
          <button
            onClick={() => setActiveTab("db")}
            className={`px-4 py-2 flex items-center space-x-2 ${
              activeTab === "db"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-lg`}
          >
            <Database className="w-5 h-5" />
            <span>DB</span>
          </button>
        </div>

        {activeTab === "form" ? (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.date")}
                  </label>
                  <DatePicker
                    selected={inspectionDate}
                    onChange={(date) => setInspectionDate(date)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.moNo")}
                  </label>
                  <div className="relative" ref={moNoDropdownRef}>
                    <input
                      type="text"
                      value={moNoSearch}
                      onChange={(e) => setMoNoSearch(e.target.value)}
                      onFocus={() =>
                        moNoOptions.length > 0 && setShowMoNoDropdown(true)
                      }
                      placeholder={t("cutting.search_mono")}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {showMoNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {moNoOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              const newMoNo = option;
                              // Check if MO No actually changed to prevent unnecessary resets
                              if (moNo !== newMoNo) {
                                setMoNo(newMoNo);
                                setTableNo(""); // Reset selected Table No
                                setTableNoSearch(""); // Reset Table No search input
                                setTableNoOptions([]); // Clear old table options
                                setCutPanelData(null); // Reset cut panel data
                                setAvailableSizes([]); // Reset sizes
                                setAggregatedTotalOrderQty(null); // Reset aggregated Qty
                                // Add any other state resets that depend on MO or TableNo
                              }
                              setMoNoSearch(newMoNo); // Update search to reflect selection
                              setShowMoNoDropdown(false);
                            }}
                            // onClick={() => {
                            //   setMoNo(option);
                            //   setMoNoSearch(option);
                            //   setShowMoNoDropdown(false);
                            // }}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.tableNo")}
                  </label>
                  <div className="flex items-center gap-2">
                    {cutPanelData && (
                      <button
                        onClick={() => setShowOrderDetails(!showOrderDetails)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {showOrderDetails ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div className="relative flex-1" ref={tableNoDropdownRef}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tableNoSearch}
                        onChange={(e) => {
                          setTableNoSearch(e.target.value);
                          setShowTableNoDropdown(true);
                        }}
                        onFocus={() =>
                          tableNoOptions.length > 0 &&
                          setShowTableNoDropdown(true)
                        }
                        placeholder={t("cutting.search_table_no")}
                        className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
                          !moNo ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        disabled={!moNo}
                      />
                      {showTableNoDropdown && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                          {tableNoOptions
                            .filter((table) =>
                              table
                                .toLowerCase()
                                .includes(tableNoSearch.toLowerCase())
                            )
                            .map((table, index) => (
                              <li
                                key={index}
                                onClick={() => {
                                  setTableNo(table);
                                  setTableNoSearch(table);
                                  setShowTableNoDropdown(false);
                                }}
                                className="p-2 hover:bg-blue-100 cursor-pointer"
                              >
                                {table}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {cutPanelData && showOrderDetails && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {t("cutting.orderDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.buyer")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.buyerStyle")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.color")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.lotNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.orderQty")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.Buyer}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.BuyerStyle}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.Color}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.LotNos.join(", ")}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalOrderQty}
                            {/* New aggregated total display */}
                            {aggregatedTotalOrderQty !== null &&
                              aggregatedTotalOrderQty !== undefined && (
                                <div className="mt-1">
                                  <span className="font-bold text-xs text-green-600">
                                    Total: {aggregatedTotalOrderQty}
                                  </span>
                                </div>
                              )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.fabricDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.fabricType")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.material")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.rollQty")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadYds")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.unit")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.grossKgs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.netKgs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.totalTTLRoll")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.FabricType}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {cutPanelData.Material}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.RollQty}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.SpreadYds}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.Unit}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.GrossKgs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.NetKgs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalTTLRoll}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.cuttingTableDetails")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadTable")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.spreadTableNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.planLayers")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.actualLayers")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.totalPcs")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.mackerNo")}
                          </th>
                          <th className="border border-gray-300 p-2 text-sm">
                            {t("cutting.mackerLength")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 text-center  text-sm">
                            {cutPanelData.SpreadTable}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {tableNo ? tableNo.replace(/^T\s*/, "") : ""}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.PlanLayer}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.ActualLayer}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.TotalPcs}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.MackerNo}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-sm">
                            {cutPanelData.MackerLength}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700 mt-4">
                    {t("cutting.markerRatio")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          {cutPanelData.MarkerRatio.filter(
                            (mr) =>
                              mr.cuttingRatio !== null &&
                              mr.cuttingRatio !== "" &&
                              mr.cuttingRatio > 0
                          ).map((mr, index) => (
                            <th
                              key={index}
                              className="border border-gray-300 p-2 text-sm"
                            >
                              {mr.size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {cutPanelData.MarkerRatio.filter(
                            (mr) =>
                              mr.cuttingRatio !== null &&
                              mr.cuttingRatio !== "" &&
                              mr.cuttingRatio > 0
                          ).map((mr, index) => (
                            <td
                              key={index}
                              className="border border-gray-300 p-2 text-sm text-center"
                            >
                              {mr.cuttingRatio}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Progress Bar and Inspection Stats */}
                  {selectedPanel && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        {t("cutting.inspectionProgress")}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-800 h-4 rounded-full"
                          style={{
                            width: `${
                              inspectionProgress && inspectionProgress.total > 0
                                ? (inspectionProgress.completed /
                                    inspectionProgress.total) *
                                  100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {inspectionProgress
                          ? `${inspectionProgress.completed}/${
                              inspectionProgress.total
                            } ${t("cutting.completed")}`
                          : t("cutting.inspectionNotStarted")}
                      </p>
                      {inspectionProgress && (
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1 text-blue-600" />
                            <span>
                              {t("cutting.totalInspected")}:{" "}
                              {inspectionProgress.inspected}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            <span>
                              {t("cutting.pass")}: {inspectionProgress.pass}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-1 text-red-600" />
                            <span>
                              {t("cutting.reject")}: {inspectionProgress.reject}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Percent className="w-4 h-4 mr-1 text-purple-600" />
                            <span>
                              {t("cutting.passRate")}:{" "}
                              {inspectionProgress.passRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {cutPanelData && (
                <div className="mt-6">
                  <hr className="my-4 border-gray-300" />
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.totalBundleQty")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={totalBundleQty}
                          onChange={(e) => setTotalBundleQty(e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Total Bundle Qty"
                        />
                        {!isTablet && (
                          <button
                            onClick={() => setShowNumberPad(true)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                          >
                            <Keyboard className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {showNumberPad && (
                        <NumberPad
                          onClose={() => setShowNumberPad(false)}
                          onInput={(value) => setTotalBundleQty(value)}
                          initialValue={totalBundleQty}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.bundleQtyCheck")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={bundleQtyCheck}
                          onChange={(e) => setBundleQtyCheck(e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Bundle Qty Check"
                          readOnly={
                            totalBundleQty &&
                            (actualLayers || planLayerQty) &&
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) >=
                              501 &&
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) <=
                              35000
                          }
                        />
                        {!isTablet &&
                          (!totalBundleQty ||
                            (!actualLayers && !planLayerQty) ||
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) <
                              501 ||
                            parseInt(totalBundleQty) *
                              (actualLayers || planLayerQty) >
                              35000) && (
                            <button
                              onClick={() =>
                                setShowBundleQtyCheckNumberPad(true)
                              }
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                            >
                              <Keyboard className="w-5 h-5" />
                            </button>
                          )}
                      </div>
                      {showBundleQtyCheckNumberPad && (
                        <NumberPad
                          onClose={() => setShowBundleQtyCheckNumberPad(false)}
                          onInput={(value) => setBundleQtyCheck(value)}
                          initialValue={bundleQtyCheck}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.totalInspectionQty")}
                      </label>
                      <div className="relative">
                        <input
                          type={isTablet ? "number" : "text"}
                          inputMode="numeric"
                          value={totalInspectionQty}
                          onChange={(e) => {
                            setTotalInspectionQty(e.target.value);
                            setIsTotalInspectionQtyManual(true);
                          }}
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="Enter Total Inspection Qty"
                        />
                        {!isTablet && (
                          <button
                            onClick={() =>
                              setShowTotalInspectionQtyNumberPad(true)
                            }
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                          >
                            <Keyboard className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {showTotalInspectionQtyNumberPad && (
                        <NumberPad
                          onClose={() =>
                            setShowTotalInspectionQtyNumberPad(false)
                          }
                          onInput={(value) => {
                            setTotalInspectionQty(value);
                            setIsTotalInspectionQtyManual(true);
                          }}
                          initialValue={totalInspectionQty}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.cuttingBy")}
                      </label>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={cuttingByAuto}
                            onChange={(e) => setCuttingByAuto(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            {t("cutting.auto")}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={cuttingByManual}
                            onChange={(e) =>
                              setCuttingByManual(e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            {t("cutting.manual")}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {t("cutting.samplingStandard")}
                  </div>

                  {aqlDetails && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-100 transition-colors flex flex-wrap gap-4 text-sm text-gray-800 font-medium">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span>Type: General</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Level: II</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span>
                          Sample Size Code Letter:{" "}
                          {aqlDetails.SampleSizeLetterCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4 text-blue-600" />
                        <span>
                          AQL Sample Requirement: {aqlDetails.SampleSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Ac: {aqlDetails.AcceptDefect}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-blue-600" />
                        <span>Re: {aqlDetails.RejectDefect}</span>
                      </div>
                    </div>
                  )}

                  <hr className="my-4 border-gray-300" />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.panel")}
                      </label>
                      <select
                        value={selectedPanel}
                        onChange={(e) => {
                          setSelectedPanel(e.target.value);
                          setBundleQty("");
                          setBundleTableData([]);
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">{t("cutting.select_panel")}</option>
                        {panels.map((panelObj, index) => (
                          <option key={index} value={panelObj.panel}>
                            {i18n.language === "km"
                              ? panelObj.panelKhmer || panelObj.panel
                              : i18n.language === "zh"
                              ? panelObj.panelChinese || panelObj.panel
                              : panelObj.panel}
                            :--({panelObj.panelKhmer})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.size")}
                      </label>
                      <select
                        value={selectedSize}
                        onChange={(e) => {
                          setSelectedSize(e.target.value);
                          setBundleQty("");
                          setBundleTableData([]);
                          setBundleQtyError("");
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={
                          !tableNo ||
                          availableSizes.length === 0 ||
                          !selectedPanel ||
                          (inspectionProgress &&
                            inspectionProgress.completed ===
                              inspectionProgress.total)
                        }
                      >
                        <option value="">{t("cutting.select_size")}</option>
                        {availableSizes.map((size, index) => (
                          <option
                            key={index}
                            value={size}
                            disabled={
                              inspectedSizes.includes(size) ||
                              (inspectionProgress &&
                                inspectionProgress.completed ===
                                  inspectionProgress.total)
                            }
                            className={
                              inspectedSizes.includes(size) ||
                              (inspectionProgress &&
                                inspectionProgress.completed ===
                                  inspectionProgress.total)
                                ? "text-gray-400"
                                : ""
                            }
                          >
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("cutting.bundleQty")}
                      </label>
                      <select
                        value={bundleQty}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          // Validate bundleQty against bundleQtyCheck and inspected sizes
                          const totalInspectedQty = inspectionProgress
                            ? inspectionProgress.completed
                            : 0;
                          const remainingQty =
                            parseInt(bundleQtyCheck) - totalInspectedQty;
                          if (qty > remainingQty) {
                            setBundleQtyError(t("cutting.invalidBundleQty"));
                            setBundleQty("");
                            setBundleTableData([]);
                            return;
                          }
                          setBundleQtyError("");
                          setBundleQty(e.target.value);
                          const newBundleTableData = Array.from(
                            { length: qty },
                            (_, i) => ({
                              bundleNo: i + 1,
                              serialLetter: "",
                              parts: [],
                              tValue: 5,
                              mValue: 5,
                              bValue: 5
                            })
                          );
                          setBundleTableData(newBundleTableData);
                          setColCounts(
                            Array.from({ length: qty }, () => ({
                              Top: 5,
                              Middle: 5,
                              Bottom: 5
                            }))
                          );
                          setTableData(
                            Array.from({ length: qty }, () => ({
                              Top: [],
                              Middle: [],
                              Bottom: []
                            }))
                          );
                          setColumnDefects(
                            Array.from({ length: qty }, () => ({
                              Top: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([])),
                              Middle: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([])),
                              Bottom: Array(5)
                                .fill([])
                                .map(() => Array(5).fill([]))
                            }))
                          );
                          setSummary({
                            Top: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            },
                            Middle: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            },
                            Bottom: {
                              totalParts: 0,
                              totalPass: 0,
                              totalReject: 0,
                              rejectMeasurement: 0,
                              rejectDefects: 0,
                              passRate: 0,
                              bundles: Array(qty).fill(null)
                            }
                          });
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!selectedSize}
                      >
                        <option value="">
                          {t("cutting.select_bundle_qty")}
                        </option>
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      {bundleQtyError && (
                        <p className="mt-1 text-sm text-red-600">
                          {bundleQtyError}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
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

                  {bundleQty && !bundleQtyError && (
                    <div className="mt-4">
                      <h2 className="text-sm font-semibold text-gray-700">
                        {t("cutting.bundleDetails")}
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 mt-2">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-sm w-16">
                                {t("cutting.bundleNo")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-24">
                                {t("cutting.serialLetter")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-auto">
                                {t("cutting.parts")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-40">
                                {t("cutting.pcs")}
                              </th>
                              <th className="border border-gray-300 p-2 text-sm w-20">
                                {t("cutting.totalPcs")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundleTableData.map((row, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2 text-sm text-center w-16">
                                  {row.bundleNo}
                                </td>
                                <td className="border border-gray-300 p-2 text-sm w-24">
                                  <select
                                    value={row.serialLetter}
                                    onChange={(e) => {
                                      const newData = [...bundleTableData];
                                      newData[index].serialLetter =
                                        e.target.value;
                                      setBundleTableData(newData);
                                    }}
                                    className="w-full p-1 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="">
                                      {t("cutting.select_serial_letter")}
                                    </option>
                                    {serialLetters.map((letter, i) => (
                                      <option key={i} value={letter}>
                                        {letter}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="border border-gray-300 p-2 text-sm w-auto">
                                  <div className="flex flex-wrap gap-2">
                                    {panelIndexNames.map((item, i) => {
                                      // Using 'i' for the inner loop index
                                      const isChecked = row.parts.includes(
                                        item.panelIndexName
                                      );
                                      // 'row' comes from the outer map (bundleTableData.map((row, index) => ...))
                                      const isDisabled = isPartCheckboxDisabled(
                                        row,
                                        item.panelIndexName
                                      );

                                      return (
                                        // Explicit return for the label JSX
                                        <label
                                          key={i} // Using 'i' for the key
                                          className={`flex items-center space-x-1 text-sm ${
                                            isDisabled
                                              ? "text-gray-400 cursor-not-allowed"
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onChange={(e) => {
                                              const newBundleTableDataState = [
                                                ...bundleTableData
                                              ];
                                              // Use 'index' from the outer map to get the correct bundle object
                                              const currentBundleObject =
                                                newBundleTableDataState[index];
                                              const partName =
                                                item.panelIndexName;
                                              let updatedPartsArray;

                                              if (e.target.checked) {
                                                updatedPartsArray = [partName]; // Single selection logic
                                              } else {
                                                updatedPartsArray = []; // Clear selection on uncheck
                                              }
                                              // Use 'index' from the outer map to update the correct bundle's parts
                                              newBundleTableDataState[
                                                index
                                              ].parts = updatedPartsArray;
                                              setBundleTableData(
                                                newBundleTableDataState
                                              );
                                            }}
                                            className={`h-4 w-4 text-blue-600 border-gray-300 rounded ${
                                              isDisabled
                                                ? "cursor-not-allowed"
                                                : "cursor-pointer"
                                            }`}
                                          />
                                          <span>
                                            {(() => {
                                              if (i18n.language === "km") {
                                                return (
                                                  item.panelIndexNameKhmer ||
                                                  item.panelIndexName
                                                );
                                              } else if (
                                                i18n.language === "zh" &&
                                                item.panelIndexNameChinese
                                              ) {
                                                return (
                                                  item.panelIndexNameChinese ||
                                                  item.panelIndexName
                                                );
                                              } else {
                                                return item.panelIndexName;
                                              }
                                            })()}
                                            {i18n.language !== "km" &&
                                              item.panelIndexNameKhmer &&
                                              ` (${item.panelIndexNameKhmer})`}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-2 text-sm">
                                    {row.parts
                                      .map((part) => {
                                        const partDetail = panelIndexNames.find(
                                          (p) => p.panelIndexName === part
                                        );
                                        if (!partDetail) return part;

                                        if (i18n.language === "km") {
                                          return (
                                            partDetail.panelIndexNameKhmer ||
                                            partDetail.panelIndexName
                                          );
                                        } else if (
                                          i18n.language === "zh" &&
                                          partDetail.panelIndexNameChinese
                                        ) {
                                          return (
                                            partDetail.panelIndexNameChinese ||
                                            partDetail.panelIndexName
                                          );
                                        } else {
                                          return partDetail.panelIndexName;
                                        }
                                      })
                                      .join(", ")}
                                  </div>
                                </td>

                                <td className="border border-gray-300 p-2 text-sm w-40">
                                  <div className="flex items-center gap-2">
                                    <span>T:</span>
                                    <select
                                      value={row.tValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].tValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(10)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                    <span>M:</span>
                                    <select
                                      value={row.mValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].mValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(10)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                    <span>B:</span>
                                    <select
                                      value={row.bValue || 5}
                                      onChange={(e) => {
                                        //if (row.parts.length > 0) return; // Prevent state update if parts selected
                                        const newData = [...bundleTableData];
                                        newData[index].bValue = e.target.value;
                                        setBundleTableData(newData);
                                      }}
                                      className="p-1 border border-gray-300 rounded-lg text-sm"
                                      //disabled={row.parts.length > 0}
                                    >
                                      {[...Array(10)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2 text-sm text-center w-20">
                                  {calculateTotalPcs(row)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {selectedPanel && filteredMeasurementPoints.length > 0 && (
                    <>
                      <hr className="my-4 border-gray-300" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {t("cutting.summaryDetails")}
                      </h3>
                      <div className="mb-4">
                        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-4">
                          <div className="p-4 bg-blue-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.parts")}
                            </p>
                            <p className="text-lg font-bold">
                              {bundleTableData.reduce(
                                (acc, row) => acc + calculateTotalPcs(row),
                                0
                              )}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.tValue) || 5),
                                0
                              )}
                              , M:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.mValue) || 5),
                                0
                              )}
                              , B:{" "}
                              {bundleTableData.reduce(
                                (acc, row) =>
                                  acc +
                                  row.parts.length *
                                    (parseInt(row.bValue) || 5),
                                0
                              )}
                            </p>
                          </div>
                          <div className="p-4 bg-green-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.pass")}
                            </p>
                            <p className="text-lg font-bold">
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs = calculateTotalPcs(row);
                                const totalReject = [
                                  "Top",
                                  "Middle",
                                  "Bottom"
                                ].reduce(
                                  (rejectAcc, tab) =>
                                    rejectAcc +
                                    (summary[tab].bundles?.[bundleIndex]
                                      ?.totalReject || 0),
                                  0
                                );
                                return acc + (totalPcs - totalReject);
                              }, 0)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.tValue) || 5);
                                const reject =
                                  summary.Top.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                              , M:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.mValue) || 5);
                                const reject =
                                  summary.Middle.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                              , B:{" "}
                              {bundleTableData.reduce((acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs =
                                  row.parts.length *
                                  (parseInt(row.bValue) || 5);
                                const reject =
                                  summary.Bottom.bundles?.[bundleIndex]
                                    ?.totalReject || 0;
                                return acc + (totalPcs - reject);
                              }, 0)}
                            </p>
                          </div>
                          <div className="p-4 bg-red-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.reject")}
                            </p>
                            <p className="text-lg font-bold">{totalReject}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.totalReject}, M:{" "}
                              {summary.Middle.totalReject}, B:{" "}
                              {summary.Bottom.totalReject}
                            </p>
                          </div>
                          <div className="p-4 bg-orange-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.rejectMeasurements")}
                            </p>
                            <p className="text-lg font-bold">
                              {summary.Top.rejectMeasurement +
                                summary.Middle.rejectMeasurement +
                                summary.Bottom.rejectMeasurement}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.rejectMeasurement}, M:{" "}
                              {summary.Middle.rejectMeasurement}, B:{" "}
                              {summary.Bottom.rejectMeasurement}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-100 rounded-lg text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {t("cutting.rejectDefects")}
                            </p>
                            <p className="text-lg font-bold">
                              {summary.Top.rejectDefects +
                                summary.Middle.rejectDefects +
                                summary.Bottom.rejectDefects}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              T: {summary.Top.rejectDefects}, M:{" "}
                              {summary.Middle.rejectDefects}, B:{" "}
                              {summary.Bottom.rejectDefects}
                            </p>
                          </div>
                          {(() => {
                            const totalParts = bundleTableData.reduce(
                              (acc, row) => acc + calculateTotalPcs(row),
                              0
                            );
                            const totalPass = bundleTableData.reduce(
                              (acc, row) => {
                                const bundleIndex = row.bundleNo - 1;
                                const totalPcs = calculateTotalPcs(row);
                                const totalReject = [
                                  "Top",
                                  "Middle",
                                  "Bottom"
                                ].reduce(
                                  (rejectAcc, tab) =>
                                    rejectAcc +
                                    (summary[tab].bundles?.[bundleIndex]
                                      ?.totalReject || 0),
                                  0
                                );
                                return acc + (totalPcs - totalReject);
                              },
                              0
                            );
                            const passRate =
                              totalParts > 0
                                ? ((totalPass / totalParts) * 100).toFixed(2)
                                : 0;
                            const bgColor =
                              passRate < 90 ? "bg-red-100" : "bg-green-100";

                            return (
                              <div
                                className={`p-4 ${bgColor} rounded-lg text-center`}
                              >
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.passRate")}
                                </p>
                                <p className="text-lg font-bold">{passRate}%</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.tValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.tValue) || 5);
                                        const reject =
                                          summary.Top.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %, M:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.mValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.mValue) || 5);
                                        const reject =
                                          summary.Middle.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %, B:{" "}
                                  {(() => {
                                    const parts = bundleTableData.reduce(
                                      (acc, row) =>
                                        acc +
                                        row.parts.length *
                                          (parseInt(row.bValue) || 5),
                                      0
                                    );
                                    const pass = bundleTableData.reduce(
                                      (acc, row) => {
                                        const bundleIndex = row.bundleNo - 1;
                                        const totalPcs =
                                          row.parts.length *
                                          (parseInt(row.bValue) || 5);
                                        const reject =
                                          summary.Bottom.bundles?.[bundleIndex]
                                            ?.totalReject || 0;
                                        return acc + (totalPcs - reject);
                                      },
                                      0
                                    );
                                    return parts > 0
                                      ? ((pass / parts) * 100).toFixed(0)
                                      : 0;
                                  })()}
                                  %
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <hr className="my-4 border-gray-300" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {t("cutting.measurementDetails")}
                      </h3>
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={() => setActiveMeasurementTab("Top")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Top"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          } rounded-l-lg`}
                        >
                          {t("cutting.top")}
                        </button>
                        <button
                          onClick={() => setActiveMeasurementTab("Middle")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Middle"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {t("cutting.middle")}
                        </button>
                        <button
                          onClick={() => setActiveMeasurementTab("Bottom")}
                          className={`px-4 py-2 ${
                            activeMeasurementTab === "Bottom"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          } rounded-r-lg`}
                        >
                          {t("cutting.bottom")}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.panelType")}
                          </label>
                          <select
                            value={filters.panelName}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                panelName: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelName").map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.side")}
                          </label>
                          <select
                            value={filters.side}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                side: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelSide").map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.direction")}
                          </label>
                          <select
                            value={filters.direction}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                direction: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("panelDirection").map(
                              (option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t("cutting.lw")}
                          </label>
                          <select
                            value={filters.lw}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                lw: e.target.value
                              })
                            }
                            className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">All</option>
                            {uniqueOptions("measurementSide").map(
                              (option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                      {bundleTableData.map((bundle, bundleIndex) => {
                        if (
                          !tableData[bundleIndex] ||
                          bundle.parts.length === 0
                        ) {
                          return (
                            <div key={bundleIndex} className="mt-4">
                              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                                {t("cutting.bundleNo")}: {bundle.bundleNo}
                              </h2>
                              <p className="text-sm text-gray-600">
                                {t("cutting.noPartsSelected")}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div key={bundleIndex} className="mt-4">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">
                              {t("cutting.bundleNo")}: {bundle.bundleNo}
                            </h2>

                            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-4 mb-4">
                              <div className="p-4 bg-blue-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.parts")}
                                </p>

                                <p className="text-lg font-bold">
                                  {calculateTotalPcs(bundle)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.tValue) || 5)}
                                  , M:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.mValue) || 5)}
                                  , B:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.bValue) || 5)}
                                </p>
                              </div>
                              <div className="p-4 bg-green-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.pass")}
                                </p>
                                <p className="text-lg font-bold">
                                  {(() => {
                                    const totalPcs = calculateTotalPcs(bundle);
                                    const totalReject = [
                                      "Top",
                                      "Middle",
                                      "Bottom"
                                    ].reduce(
                                      (acc, tab) =>
                                        acc +
                                        (summary[tab].bundles?.[bundleIndex]
                                          ?.totalReject || 0),
                                      0
                                    );
                                    return totalPcs - totalReject;
                                  })()}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.tValue) || 5) -
                                    (summary.Top.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                  , M:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.mValue) || 5) -
                                    (summary.Middle.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                  , B:{" "}
                                  {bundle.parts.length *
                                    (parseInt(bundle.bValue) || 5) -
                                    (summary.Bottom.bundles?.[bundleIndex]
                                      ?.totalReject || 0)}
                                </p>
                              </div>
                              <div className="p-4 bg-red-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.reject")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.totalReject || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.totalReject || 0}
                                </p>
                              </div>
                              <div className="p-4 bg-orange-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.rejectMeasurements")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.rejectMeasurement || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.rejectMeasurement || 0}
                                </p>
                              </div>
                              <div className="p-4 bg-purple-100 rounded-lg text-center">
                                <p className="text-xs font-medium text-gray-700">
                                  {t("cutting.rejectDefects")}
                                </p>
                                <p className="text-lg font-bold">
                                  {["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.rejectDefects || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  T:{" "}
                                  {summary.Top.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                  , M:{" "}
                                  {summary.Middle.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                  , B:{" "}
                                  {summary.Bottom.bundles?.[bundleIndex]
                                    ?.rejectDefects || 0}
                                </p>
                              </div>
                              {(() => {
                                const totalPcs = calculateTotalPcs(bundle);
                                const totalPass =
                                  totalPcs -
                                  ["Top", "Middle", "Bottom"].reduce(
                                    (acc, tab) =>
                                      acc +
                                      (summary[tab].bundles?.[bundleIndex]
                                        ?.totalReject || 0),
                                    0
                                  );
                                const passRate =
                                  totalPcs > 0
                                    ? ((totalPass / totalPcs) * 100).toFixed(2)
                                    : 0;
                                const bgColor =
                                  passRate < 90 ? "bg-red-100" : "bg-green-100";

                                return (
                                  <div
                                    className={`p-4 ${bgColor} rounded-lg text-center`}
                                  >
                                    <p className="text-xs font-medium text-gray-700">
                                      {t("cutting.passRate")}
                                    </p>
                                    <p className="text-lg font-bold">
                                      {passRate}%
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      T:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.tValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Top.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %, M:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.mValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Middle.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %, B:{" "}
                                      {(() => {
                                        const totalPcs =
                                          bundle.parts.length *
                                          (parseInt(bundle.bValue) || 5);
                                        const totalPass =
                                          totalPcs -
                                          (summary.Bottom.bundles?.[bundleIndex]
                                            ?.totalReject || 0);
                                        return totalPcs > 0
                                          ? (
                                              (totalPass / totalPcs) *
                                              100
                                            ).toFixed(0)
                                          : 0;
                                      })()}
                                      %
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            {activeMeasurementTab === "Top" && (
                              <MeasurementTable
                                key={`Top-${selectedPanel}-${bundleIndex}`}
                                tab="Top"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Top || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Top", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Top || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Top", data)
                                }
                                filters={filters}
                                defects={columnDefects[bundleIndex]?.Top || []}
                                setDefects={(newDefects) =>
                                  updateDefects(bundleIndex, "Top", newDefects)
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                            {activeMeasurementTab === "Middle" && (
                              <MeasurementTable
                                key={`Middle-${selectedPanel}-${bundleIndex}`}
                                tab="Middle"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Middle || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Middle", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Middle || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Middle", data)
                                }
                                filters={filters}
                                defects={
                                  columnDefects[bundleIndex]?.Middle || []
                                }
                                setDefects={(newDefects) =>
                                  updateDefects(
                                    bundleIndex,
                                    "Middle",
                                    newDefects
                                  )
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                            {activeMeasurementTab === "Bottom" && (
                              <MeasurementTable
                                key={`Bottom-${selectedPanel}-${bundleIndex}`}
                                tab="Bottom"
                                measurementPoints={measurementPoints} //{filteredMeasurementPoints}
                                numColumns={colCounts[bundleIndex]?.Bottom || 5}
                                tolerance={tolerance}
                                onUpdate={(data) =>
                                  updateSummary("Bottom", data, bundleIndex)
                                }
                                tableData={tableData[bundleIndex]?.Bottom || []}
                                setTableData={(data) =>
                                  updateTableData(bundleIndex, "Bottom", data)
                                }
                                filters={filters}
                                defects={
                                  columnDefects[bundleIndex]?.Bottom || []
                                }
                                setDefects={(newDefects) =>
                                  updateDefects(
                                    bundleIndex,
                                    "Bottom",
                                    newDefects
                                  )
                                }
                                bundleIndex={bundleIndex}
                                selectedParts={bundle.parts}
                                moNo={moNo}
                                fabricDefects={fabricDefects} // Add this prop
                              />
                            )}
                          </div>
                        );
                      })}
                      {/* Add CuttingIssues here, after all bundles */}
                      {bundleQty && (
                        <>
                          <hr className="my-4 border-gray-300" />
                          <CuttingIssues
                            ref={cuttingIssuesRef}
                            moNo={moNo}
                            selectedPanel={selectedPanel}
                            //onIssuesChange={handleIssuesChange}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
              >
                {t("cutting.submit")}
              </button>
            </div>
          </>
        ) : activeTab === "data" ? (
          <div className="text-gray-600">
            <CuttingInspectionModify />
          </div>
        ) : activeTab === "report" ? (
          <div className="text-gray-600">
            <CuttingReportQCView />
          </div>
        ) : activeTab === "Modify" ? (
          <div className="text-gray-600">
            <CuttingMeasurementPointsModify />
          </div>
        ) : activeTab === "Adding" ? (
          <div className="text-gray-600">
            <CuttingOrderModify />
          </div>
        ) : (
          // <div className="text-gray-600">{t("cutting.dataTabPlaceholder")}</div>
          <div className="text-gray-600">
            <AQLChart />
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingPage;
