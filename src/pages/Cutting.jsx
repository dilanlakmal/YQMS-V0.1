import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Database, Keyboard } from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import NumberPad from "../components/forms/NumberPad";
import { measurementPoints } from "../constants/cuttingmeasurement";
import MeasurementTable from "../components/inspection/cutting/MeasurementTable";

const CuttingPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);
  //const [lotNo, setLotNo] = useState("");
  const [lotNo, setLotNo] = useState([]); // Array to store multiple selected Lot Nos
  const [color, setColor] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [tableNoSearch, setTableNoSearch] = useState("");
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const tableNoDropdownRef = useRef(null);

  const [cuttingTableL, setCuttingTableL] = useState("");
  const [cuttingTableNo, setCuttingTableNo] = useState("");
  const [marker, setMarker] = useState("");
  const [planLayerQty, setPlanLayerQty] = useState(0);
  const [totalPlanPcs, setTotalPlanPcs] = useState(0);
  const [actualLayers, setActualLayers] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [totalBundleQty, setTotalBundleQty] = useState("");
  const [bundleQtyCheck, setBundleQtyCheck] = useState("");
  const [totalInspectionQty, setTotalInspectionQty] = useState(0);
  const [cuttingByAuto, setCuttingByAuto] = useState(true); // Default to Auto
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
  const [availableSizes, setAvailableSizes] = useState([]);
  const [tolerance, setTolerance] = useState({ min: -0.125, max: 0.125 });
  const [activeMeasurementTab, setActiveMeasurementTab] = useState("Top");
  const [colCounts, setColCounts] = useState({ Top: 5, Middle: 5, Bottom: 5 });

  const [summary, setSummary] = useState({
    Top: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0
    },
    Middle: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0
    },
    Bottom: {
      totalParts: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurement: 0,
      rejectDefects: 0,
      passRate: 0
    }
  });

  const [tableData, setTableData] = useState({
    Top: [],
    Middle: [],
    Bottom: []
  });

  const [columnDefects, setColumnDefects] = useState({
    Top: Array(5)
      .fill([])
      .map(() => Array(5).fill([])), // 5 columns, each with 5 panel indices
    Middle: Array(5)
      .fill([])
      .map(() => Array(5).fill([])),
    Bottom: Array(5)
      .fill([])
      .map(() => Array(5).fill([]))
  });

  const [moData, setMoData] = useState(null);
  const [lotNoSearch, setLotNoSearch] = useState(""); // Search input for filtering Lot Nos
  const [lotNoInput, setLotNoInput] = useState(""); // Input for typing Lot Nos when no dropdown
  const [lotNos, setLotNos] = useState([]); // List of available Lot Nos
  const [showLotNoDropdown, setShowLotNoDropdown] = useState(false); // Control dropdown visibility
  const lotNoInputRef = useRef(null); // Ref to handle clicks outside the dropdown
  const [colors, setColors] = useState([]);
  const [tableNos, setTableNos] = useState([]);
  const [markerData, setMarkerData] = useState([]);
  const [filters, setFilters] = useState({
    panelName: "",
    side: "",
    direction: "",
    lw: ""
  });

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
          `${API_BASE_URL}/api/cutting-orders-mo-numbers`,
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
  }, [moNoSearch]);

  useEffect(() => {
    const fetchMoData = async () => {
      if (!moNo) {
        resetForm();
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-orders-details`,
          {
            params: { styleNo: moNo },
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          }
        );
        setMoData(response.data);
        const lotNames =
          response.data[0]?.lotNo?.length > 0
            ? response.data[0].lotNo.map((l) => l.LotName)
            : [];
        //: ["N/A"];
        setLotNos(lotNames);
        setLotNo([]); // Reset to empty array
        setLotNoSearch(""); // Reset search input
        setLotNoInput(""); // Reset typed input
        setShowLotNoDropdown(false); // Close dropdown
        //setLotNo("");
        const uniqueColors = [
          ...new Set(response.data.map((d) => d.EngColor))
        ].filter((color) => color);
        setColors(uniqueColors);
        setColor("");
      } catch (error) {
        console.error("Error fetching MO data:", error);
        resetForm();
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text:
            error.response?.status === 404
              ? t("cutting.moNotFound", { moNo })
              : error.response?.data?.message ||
                t("cutting.failedToFetchMOData")
        });
      }
    };
    fetchMoData();
  }, [moNo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        lotNoInputRef.current &&
        !lotNoInputRef.current.contains(event.target)
      ) {
        setShowLotNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (color && moData) {
      const selectedDocument = moData.find((d) => d.EngColor === color);
      if (selectedDocument) {
        const tableNumbers = selectedDocument.cuttingData
          .filter((cd) => cd.tableNo)
          .map((cd) => cd.tableNo);
        setTableNos(tableNumbers);
        setTableNo("");
      } else {
        setTableNos([]);
        setTableNo("");
      }
    } else {
      setTableNos([]);
      setTableNo("");
    }
    setCuttingTableL("");
    setCuttingTableNo("");
    setMarker("");
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setTotalBundleQty("");
    setBundleQtyCheck("");
    setTotalInspectionQty(0);
    setSelectedPanel("");
    setSelectedSize("");
    setSelectedSerialLetter("");
    setMarkerData([]);
    setAvailableSizes([]);
  }, [color, moData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
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
    if (tableNo && color && moData) {
      const selectedDocument = moData.find((d) => d.EngColor === color);
      if (selectedDocument) {
        const selectedCuttingData = selectedDocument.cuttingData.find(
          (cd) => cd.tableNo === tableNo
        );
        if (selectedCuttingData) {
          const tableNoStr = selectedCuttingData.tableNo || "";
          const no = tableNoStr.replace(/[T\s]/g, "");
          setCuttingTableNo(no);
          setMarker(selectedCuttingData.markerNo || "N/A");
          setPlanLayerQty(selectedCuttingData.planLayerQty || 0);
          setTotalPlanPcs(selectedCuttingData.totalPlanPcs || 0);
          setActualLayers(selectedCuttingData.actualLayers || 0);
          setMarkerData(
            selectedCuttingData.markerData.filter(
              (md) => md.markerRatio !== null
            )
          );
          const fetchSizes = async () => {
            try {
              const response = await axios.get(
                `${API_BASE_URL}/api/cutting-orders-sizes`,
                {
                  params: { styleNo: moNo, color, tableNo },
                  headers: { "Content-Type": "application/json" },
                  withCredentials: true
                }
              );
              setAvailableSizes(response.data);
            } catch (error) {
              console.error("Error fetching sizes:", error);
              setAvailableSizes([]);
              Swal.fire({
                icon: "error",
                title: t("cutting.error"),
                text: t("cutting.failedToFetchSizes")
              });
            }
          };
          fetchSizes();
        } else {
          resetTableData();
        }
      }
    } else {
      resetTableData();
    }
    setCuttingTableL("");
  }, [tableNo, color, moData, moNo, t]);

  useEffect(() => {
    if (totalBundleQty && (actualLayers || planLayerQty)) {
      const layersToUse = actualLayers || planLayerQty;
      const multiplication = parseInt(totalBundleQty) * layersToUse;
      let calculatedBundleQtyCheck;
      if (multiplication >= 501 && multiplication <= 1200)
        calculatedBundleQtyCheck = 5;
      else if (multiplication >= 1201 && multiplication <= 3000)
        calculatedBundleQtyCheck = 9;
      else if (multiplication >= 3201 && multiplication <= 10000)
        calculatedBundleQtyCheck = 14;
      else if (multiplication >= 10001 && multiplication <= 35000)
        calculatedBundleQtyCheck = 20;
      else calculatedBundleQtyCheck = bundleQtyCheck || "";
      setBundleQtyCheck(calculatedBundleQtyCheck.toString());
      if (!isTotalInspectionQtyManual) {
        setTotalInspectionQty(calculatedBundleQtyCheck * 15);
      }
    } else {
      setBundleQtyCheck("");
      if (!isTotalInspectionQtyManual) {
        setTotalInspectionQty(0);
      }
    }
    //   setTotalInspectionQty(calculatedBundleQtyCheck * 15);
    // } else {
    //   setBundleQtyCheck("");
    //   setTotalInspectionQty(0);
    // }
  }, [totalBundleQty, actualLayers, planLayerQty, isTotalInspectionQtyManual]);

  useEffect(() => {
    if (bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
    } else if (!bundleQtyCheck && !isTotalInspectionQtyManual) {
      setTotalInspectionQty(0);
    }
  }, [bundleQtyCheck, isTotalInspectionQtyManual]);

  // useEffect(() => {
  //   if (bundleQtyCheck) setTotalInspectionQty(parseInt(bundleQtyCheck) * 15);
  //   else setTotalInspectionQty(0);
  // }, [bundleQtyCheck]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      )
        setShowMoNoDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setMoNo("");
    setMoNoSearch("");
    setMoNoOptions([]);
    setShowMoNoDropdown(false);
    setMoData(null);
    setLotNo([]); // Changed to array
    //setLotNo("");
    setLotNoSearch(""); // Reset search input
    setLotNoInput(""); // Reset typed input
    setShowLotNoDropdown(false); // Close dropdown
    setColor("");
    setTableNo("");
    setCuttingTableL("");
    setCuttingTableNo("");
    setMarker("");
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setTotalBundleQty("");
    setBundleQtyCheck("");
    setTotalInspectionQty(0);
    setShowTotalInspectionQtyNumberPad(false); // Reset NumberPad visibility
    setIsTotalInspectionQtyManual(false); // Reset manual edit flag
    setCuttingByAuto(true); // Reset to default
    setCuttingByManual(false);
    setSelectedPanel("");
    setSelectedSize("");
    setSelectedSerialLetter("");
    setLotNos([]);
    setColors([]);
    setTableNos([]);
    setMarkerData([]);
    setAvailableSizes([]);
    setShowOrderDetails(false);
    setTolerance({ min: -0.125, max: 0.125 });
    setActiveMeasurementTab("Top");
    setColCounts({ Top: 5, Middle: 5, Bottom: 5 });
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      }
    });
    setTableData({ Top: [], Middle: [], Bottom: [] });
    setColumnDefects({
      Top: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Middle: Array(5)
        .fill([])
        .map(() => Array(5).fill([])),
      Bottom: Array(5)
        .fill([])
        .map(() => Array(5).fill([]))
    });
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  };

  const resetMeasurementData = () => {
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      }
    });
    setTableData({ Top: [], Middle: [], Bottom: [] });

    setColumnDefects({
      Top: Array(colCounts.Top)
        .fill([])
        .map(() => Array(5).fill([])),
      Middle: Array(colCounts.Middle)
        .fill([])
        .map(() => Array(5).fill([])),
      Bottom: Array(colCounts.Bottom)
        .fill([])
        .map(() => Array(5).fill([]))
    });
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  };

  // New useEffect
  useEffect(() => {
    //Reset tableData and columnDefects when selectedPanel changes
    setTableData({
      Top: [],
      Middle: [],
      Bottom: []
    });

    // Reset summary to reflect the new panel
    setSummary({
      Top: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Middle: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      },
      Bottom: {
        totalParts: 0,
        totalPass: 0,
        totalReject: 0,
        rejectMeasurement: 0,
        rejectDefects: 0,
        passRate: 0
      }
    });
    setColumnDefects({
      Top: Array(colCounts.Top)
        .fill([])
        .map(() => Array(5).fill([])),
      Middle: Array(colCounts.Middle)
        .fill([])
        .map(() => Array(5).fill([])),
      Bottom: Array(colCounts.Bottom)
        .fill([])
        .map(() => Array(5).fill([]))
    });
    // Reset filters to ensure they don't interfere with the new panel
    setFilters({ panelName: "", side: "", direction: "", lw: "" });
  }, [selectedPanel, colCounts.Top, colCounts.Middle, colCounts.Bottom]);

  const resetTableData = () => {
    setCuttingTableNo("");
    setMarker("");
    setPlanLayerQty(0);
    setTotalPlanPcs(0);
    setActualLayers(0);
    setTotalBundleQty("");
    setBundleQtyCheck("");
    setTotalInspectionQty(0);
    setCuttingByAuto(true); // Reset to default
    setCuttingByManual(false);
    setSelectedPanel("");
    setSelectedSize("");
    setSelectedSerialLetter("");
    setMarkerData([]);
    setAvailableSizes([]);
  };

  const collectMeasurementData = (
    tab,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !moNo ||
      //!lotNo ||
      lotNo.length === 0 || // Changed to check array length
      !color ||
      !tableNo ||
      !totalBundleQty ||
      !bundleQtyCheck ||
      !selectedPanel ||
      !selectedSize ||
      !selectedSerialLetter
    ) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t("cutting.fillRequiredFields")
      });
      return;
    }

    let cuttingtype = "";
    if (cuttingByAuto && cuttingByManual) {
      cuttingtype = "Auto & Manual";
    } else if (cuttingByAuto) {
      cuttingtype = "Auto";
    } else if (cuttingByManual) {
      cuttingtype = "Manual";
    } else {
      cuttingtype = "None"; // Optional: handle case where neither is selected
    }

    const inspectionData = {
      size: selectedSize,
      serialLetter: selectedSerialLetter,
      tolerance,
      totalPcs: totalParts,
      totalPass: totalPass,
      totalReject: totalReject,
      totalRejectMeasurement:
        summary.Top.rejectMeasurement +
        summary.Middle.rejectMeasurement +
        summary.Bottom.rejectMeasurement,
      totalRejectDefects:
        summary.Top.rejectDefects +
        summary.Middle.rejectDefects +
        summary.Bottom.rejectDefects,
      passRate:
        totalParts > 0
          ? parseFloat(((totalPass / totalParts) * 100).toFixed(2))
          : 0,
      pcsLocation: [
        {
          location: "Top",
          pcs: summary.Top.totalParts,
          pass: summary.Top.totalPass,
          reject: summary.Top.totalReject,
          rejectGarment: summary.Top.totalReject, // Assuming rejectGarment is same as totalReject
          rejectMeasurement: summary.Top.rejectMeasurement,
          passrate: summary.Top.passRate,
          measurementData: collectMeasurementData(
            "Top",
            tableData.Top,
            columnDefects.Top,
            tolerance,
            colCounts.Top
          )
        },
        {
          location: "Middle",
          pcs: summary.Middle.totalParts,
          pass: summary.Middle.totalPass,
          reject: summary.Middle.totalReject,
          rejectGarment: summary.Middle.totalReject,
          rejectMeasurement: summary.Middle.rejectMeasurement,
          passrate: summary.Middle.passRate,
          measurementData: collectMeasurementData(
            "Middle",
            tableData.Middle,
            columnDefects.Middle,
            tolerance,
            colCounts.Middle
          )
        },
        {
          location: "Bottom",
          pcs: summary.Bottom.totalParts,
          pass: summary.Bottom.totalPass,
          reject: summary.Bottom.totalReject,
          rejectGarment: summary.Bottom.totalReject,
          rejectMeasurement: summary.Bottom.rejectMeasurement,
          passrate: summary.Bottom.passRate,
          measurementData: collectMeasurementData(
            "Bottom",
            tableData.Bottom,
            columnDefects.Bottom,
            tolerance,
            colCounts.Bottom
          )
        }
      ],
      inspectionTime: new Date().toLocaleTimeString("en-US", { hour12: false })
    };

    const report = {
      inspectionDate: inspectionDate.toLocaleDateString("en-US"),
      cutting_emp_id: user.emp_id,
      cutting_emp_engName: user.eng_name,
      cutting_emp_khName: user.kh_name,
      cutting_emp_dept: user.dept_name,
      cutting_emp_section: user.sect_name,
      moNo,
      lotNo: lotNo.join(","), // Join array into comma-separated string
      //lotNo,
      buyer: orderDetails?.Buyer || "N/A", // New field from orderDetails
      color,
      tableNo,
      planLayerQty,
      actualLayerQty: actualLayers,
      totalPcs: totalPlanPcs,
      cuttingtableLetter: cuttingTableL,
      cuttingtableNo: cuttingTableNo,
      marker,
      markerRatio: markerData.map((data, index) => ({
        index: index + 1,
        markerSize: data.size,
        ratio: data.markerRatio
      })),
      totalBundleQty: parseInt(totalBundleQty),
      bundleQtyCheck: parseInt(bundleQtyCheck),
      totalInspectionQty,
      cuttingtype,
      garmentType: selectedPanel,
      orderQty: orderDetails?.totalOrderQty || 0, // New field from orderDetails
      inspectionData
    };

    try {
      //  API call
      await axios.post(`${API_BASE_URL}/api/save-cutting-inspection`, report);
      Swal.fire({
        icon: "success",
        title: t("cutting.success"),
        text: t("cutting.dataSaved")
      });
      resetMeasurementData(); // Reset only summary details and below
      //resetForm();
    } catch (error) {
      console.error("Error saving Cutting data:", error);
      Swal.fire({
        icon: "error",
        title: t("cutting.error"),
        text: t("cutting.failedToSaveData")
      });
    }
  };

  const orderDetails =
    color && moData ? moData.find((d) => d.EngColor === color) : null;

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

  const handleColChange = (tab, value) => {
    const newCount = parseInt(value);
    setColCounts((prev) => ({ ...prev, [tab]: newCount }));
    setColumnDefects((prev) => {
      const currentDefects = prev[tab];
      const newDefects = Array(newCount)
        .fill([])
        .map(() => Array(5).fill([]));
      for (let i = 0; i < Math.min(currentDefects.length, newCount); i++) {
        // Copy existing panel indices (up to 5)
        for (let j = 0; j < Math.min(currentDefects[i].length, 5); j++) {
          newDefects[i] = currentDefects[i];
        }
      }
      return { ...prev, [tab]: newDefects };
    });
    // Summary will be recalculated by MeasurementTable
  };

  const updateSummary = (tab, data) => {
    setSummary((prev) => ({ ...prev, [tab]: data }));
  };

  const updateTableData = (tab, data) => {
    setTableData((prev) => ({ ...prev, [tab]: data }));
  };

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
    ...new Set(
      filteredMeasurementPoints.map((point) => point[key]).filter(Boolean)
    )
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
                  {orderDetails && (
                    <button
                      onClick={() => setShowOrderDetails(!showOrderDetails)}
                      className="text-gray-600 hover:text-gray-800 mt-1"
                    >
                      {showOrderDetails ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  )}
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
                      placeholder={t("cutting.search_mono")}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {showMoNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {moNoOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setMoNo(option);
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

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.lotNo")}
                  </label>
                  <div className="relative mt-1" ref={lotNoInputRef}>
                    {lotNos.length > 0 ? (
                      <>
                        <div
                          className={`w-full p-2 border border-gray-300 rounded-lg flex flex-wrap gap-1 items-center ${
                            !moNo
                              ? "bg-gray-100 cursor-not-allowed"
                              : "bg-white"
                          }`}
                        >
                          {lotNo.map((lot, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                            >
                              {lot}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLotNo(lotNo.filter((_, i) => i !== index));
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={lotNoSearch}
                            onChange={(e) => {
                              setLotNoSearch(e.target.value);
                              setShowLotNoDropdown(true);
                            }}
                            onClick={() => moNo && setShowLotNoDropdown(true)}
                            placeholder={t("cutting.search_lot_no")}
                            className="flex-1 outline-none bg-transparent min-w-[100px]"
                            disabled={!moNo}
                          />
                        </div>
                        {showLotNoDropdown && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg">
                            {lotNos
                              .filter((lot) =>
                                lot
                                  .toLowerCase()
                                  .includes(lotNoSearch.toLowerCase())
                              )
                              .map((lot, index) => (
                                <li
                                  key={index}
                                  onClick={() => {
                                    if (!lotNo.includes(lot)) {
                                      setLotNo([...lotNo, lot]);
                                      setLotNoSearch("");
                                      setShowLotNoDropdown(false);
                                    }
                                  }}
                                  className="p-2 hover:bg-blue-100 cursor-pointer"
                                >
                                  {lot}
                                </li>
                              ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <div
                        className={`w-full p-2 border border-gray-300 rounded-lg flex flex-wrap gap-1 items-center ${
                          !moNo ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                        }`}
                      >
                        {lotNo.map((lot, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                          >
                            {lot}
                            <button
                              type="button"
                              onClick={() =>
                                setLotNo(lotNo.filter((_, i) => i !== index))
                              }
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={lotNoInput}
                            onChange={(e) => setLotNoInput(e.target.value)}
                            placeholder={t("cutting.enter_lot_no")}
                            className="flex-1 outline-none bg-transparent"
                            disabled={!moNo}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                lotNoInput.trim() &&
                                !lotNo.includes(lotNoInput.trim())
                              ) {
                                setLotNo([...lotNo, lotNoInput.trim()]);
                                setLotNoInput("");
                              }
                            }}
                            className={`p-1 text-blue-600 hover:text-blue-800 ${
                              !lotNoInput.trim() || !moNo
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={!lotNoInput.trim() || !moNo}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.color")}
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    disabled={!moNo || colors.length === 0}
                  >
                    <option value="">{t("cutting.select_color")}</option>
                    {colors.map((col, index) => (
                      <option key={index} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {showOrderDetails && orderDetails && (
                <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <p>
                      <strong>{t("cutting.customerStyle")}:</strong>{" "}
                      {orderDetails.BuyerStyle || "N/A"}
                    </p>
                    <p>
                      <strong>{t("cutting.buyer")}:</strong>{" "}
                      {orderDetails.Buyer || "N/A"}
                    </p>
                    <p>
                      <strong>{t("cutting.orderQty")}:</strong>{" "}
                      {orderDetails.totalOrderQty || "N/A"}
                    </p>
                  </div>
                </div>
              )}
              <hr className="my-4 border-gray-300" />
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.tableNo")}
                  </label>
                  <div className="relative" ref={tableNoDropdownRef}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tableNoSearch}
                      onChange={(e) => {
                        setTableNoSearch(e.target.value);
                        setShowTableNoDropdown(true);
                      }}
                      onClick={() => {
                        if (color && tableNos.length > 0) {
                          setShowTableNoDropdown(true);
                        }
                      }}
                      placeholder={t("cutting.search_table_no")}
                      className={`mt-1 w-full p-2 border border-gray-300 rounded-lg ${
                        !color || tableNos.length === 0
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={!color || tableNos.length === 0}
                    />
                    {showTableNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-64 overflow-y-auto shadow-lg">
                        {tableNos
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
                  {tableNo && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="flex space-x-4 text-sm">
                        <p>
                          <strong>{t("cutting.layerQty")}</strong>{" "}
                          {planLayerQty}
                        </p>
                        <p>
                          <strong>{t("cutting.totalPcs")}</strong>{" "}
                          {totalPlanPcs}
                        </p>
                        <p>
                          <strong>{t("cutting.actualLayerQty")}</strong>{" "}
                          {actualLayers}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.cuttingTable")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600">
                        {t("cutting.l")}
                      </label>
                      <select
                        value={cuttingTableL}
                        onChange={(e) => setCuttingTableL(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!tableNo}
                      >
                        <option value="">{t("cutting.select")}</option>
                        {[...Array(26)].map((_, i) => (
                          <option key={i} value={String.fromCharCode(65 + i)}>
                            {String.fromCharCode(65 + i)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600">
                        {t("cutting.no")}
                      </label>
                      <input
                        type="text"
                        value={cuttingTableNo}
                        readOnly
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("cutting.marker")}
                  </label>
                  <input
                    type="text"
                    value={marker}
                    readOnly
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </div>
            {markerData.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {t("cutting.markerRatio")}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        {markerData.map((data, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 p-2 text-center"
                          >
                            {data.size || `Size ${data.No}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {markerData.map((data, index) => (
                          <td
                            key={index}
                            className="border border-gray-300 p-2 text-center"
                          >
                            {data.markerRatio}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {markerData.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
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
                            onClick={() => setShowBundleQtyCheckNumberPad(true)}
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
                          onChange={(e) => setCuttingByManual(e.target.checked)}
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
                        // Do not reset tableData or columnDefects here to persist data
                      }}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t("cutting.select_panel")}</option>
                      <option value="Top">{t("cutting.garment_top")}</option>
                      <option value="Bottom">
                        {t("cutting.garment_bottom")}
                      </option>
                      <option value="Zipper Jacket">
                        {t("cutting.zipper")}
                      </option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("cutting.size")}
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      disabled={!tableNo || availableSizes.length === 0}
                    >
                      <option value="">{t("cutting.select_size")}</option>
                      {availableSizes.map((size, index) => (
                        <option key={index} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("cutting.serialLetter")}
                    </label>
                    <select
                      value={selectedSerialLetter}
                      onChange={(e) => setSelectedSerialLetter(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">
                        {t("cutting.select_serial_letter")}
                      </option>
                      {serialLetters.map((letter, index) => (
                        <option key={index} value={letter}>
                          {letter}
                        </option>
                      ))}
                    </select>
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
                          <p className="text-lg font-bold">{totalParts}</p>
                        </div>
                        <div className="p-4 bg-green-100 rounded-lg text-center">
                          <p className="text-xs font-medium text-gray-700">
                            {t("cutting.pass")}
                          </p>
                          <p className="text-lg font-bold">{totalPass}</p>
                        </div>
                        <div className="p-4 bg-red-100 rounded-lg text-center">
                          <p className="text-xs font-medium text-gray-700">
                            {t("cutting.reject")}
                          </p>
                          <p className="text-lg font-bold">{totalReject}</p>
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
                        </div>
                        <div className="p-4 bg-yellow-100 rounded-lg text-center">
                          <p className="text-xs font-medium text-gray-700">
                            {t("cutting.passRate")}
                          </p>
                          <p className="text-lg font-bold">
                            {totalParts > 0
                              ? ((totalPass / totalParts) * 100).toFixed(2)
                              : 0}
                            %
                          </p>
                        </div>
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
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Col:
                      </label>
                      <select
                        value={colCounts[activeMeasurementTab]}
                        onChange={(e) =>
                          handleColChange(activeMeasurementTab, e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-lg"
                      >
                        {[...Array(5)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t("cutting.panelName")}
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
                            setFilters({ ...filters, side: e.target.value })
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
                            setFilters({ ...filters, lw: e.target.value })
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
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                      <div className="p-4 bg-blue-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.parts")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].totalParts}
                        </p>
                      </div>
                      <div className="p-4 bg-green-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.pass")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].totalPass}
                        </p>
                      </div>
                      <div className="p-4 bg-red-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.reject")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].totalReject}
                        </p>
                      </div>
                      <div className="p-4 bg-orange-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.rejectMeasurements")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].rejectMeasurement}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.rejectDefects")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].rejectDefects}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-100 rounded-lg text-center">
                        <p className="text-xs font-medium text-gray-700">
                          {t("cutting.passRate")}
                        </p>
                        <p className="text-lg font-bold">
                          {summary[activeMeasurementTab].passRate}%
                        </p>
                      </div>
                    </div>
                    {activeMeasurementTab === "Top" && (
                      <MeasurementTable
                        key={`Top-${selectedPanel}`}
                        tab="Top"
                        measurementPoints={filteredMeasurementPoints}
                        numColumns={colCounts.Top}
                        tolerance={tolerance}
                        onUpdate={(data) => updateSummary("Top", data)}
                        tableData={tableData.Top}
                        setTableData={(data) => updateTableData("Top", data)}
                        filters={filters}
                        defects={columnDefects.Top}
                        setDefects={(newDefects) =>
                          setColumnDefects((prev) => ({
                            ...prev,
                            Top: newDefects
                          }))
                        }
                      />
                    )}
                    {activeMeasurementTab === "Middle" && (
                      <MeasurementTable
                        key={`Middle-${selectedPanel}`}
                        tab="Middle"
                        measurementPoints={filteredMeasurementPoints}
                        numColumns={colCounts.Middle}
                        tolerance={tolerance}
                        onUpdate={(data) => updateSummary("Middle", data)}
                        tableData={tableData.Middle}
                        setTableData={(data) => updateTableData("Middle", data)}
                        filters={filters}
                        defects={columnDefects.Middle}
                        setDefects={(newDefects) =>
                          setColumnDefects((prev) => ({
                            ...prev,
                            Middle: newDefects
                          }))
                        }
                      />
                    )}
                    {activeMeasurementTab === "Bottom" && (
                      <MeasurementTable
                        key={`Bottom-${selectedPanel}`}
                        tab="Bottom"
                        measurementPoints={filteredMeasurementPoints}
                        numColumns={colCounts.Bottom}
                        tolerance={tolerance}
                        onUpdate={(data) => updateSummary("Bottom", data)}
                        tableData={tableData.Bottom}
                        setTableData={(data) => updateTableData("Bottom", data)}
                        filters={filters}
                        defects={columnDefects.Bottom}
                        setDefects={(newDefects) =>
                          setColumnDefects((prev) => ({
                            ...prev,
                            Bottom: newDefects
                          }))
                        }
                      />
                    )}
                  </>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  Additional Information
                </div>
              </div>
            )}
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
          <div className="text-center text-gray-600">
            {t("cutting.dataTabPlaceholder")}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            {t("cutting.dbTabPlaceholder")}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingPage;
