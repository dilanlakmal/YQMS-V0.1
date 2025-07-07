import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { calculateAccuracy } from "./aqlHelper";
import {
  Target,
  Medal,
  Award,
  Star,
  ShieldX,
  CheckCircle,
  XCircle
} from "lucide-react";

const AccuracyResult = ({ defects, checkedQty, reportType }) => {
  const { t } = useTranslation();

  // This hook correctly calculates all 4 values we need.
  const { accuracy, grade, totalDefectPoints, result } = useMemo(
    () => calculateAccuracy(defects, checkedQty, reportType),
    [defects, checkedQty, reportType]
  );

  // --- STYLING LOGIC FOR ALL 4 ITEMS ---

  // 1. Style for the Grade (A, B, C, D)
  const getGradeStyle = () => {
    switch (grade) {
      case "A":
        return {
          icon: <Medal className="text-green-400" />,
          color: "text-green-400",
          bg: "bg-green-500/10"
        };
      case "B":
        return {
          icon: <Award className="text-blue-400" />,
          color: "text-blue-400",
          bg: "bg-blue-500/10"
        };
      case "C":
        return {
          icon: <Star className="text-yellow-400" />,
          color: "text-yellow-400",
          bg: "bg-yellow-500/10"
        };
      case "D":
      default:
        return {
          icon: <ShieldX className="text-red-400" />,
          color: "text-red-400",
          bg: "bg-red-500/10"
        };
    }
  };

  // 2. Style for the Result (Pass/Fail)
  const resultStyle =
    result === "Pass"
      ? {
          icon: <CheckCircle size={24} />,
          text: t("qcAccuracy.pass", "PASS"),
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/50"
        }
      : {
          icon: <XCircle size={24} />,
          text: t("qcAccuracy.fail", "FAIL"),
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/50"
        };

  // Get the specific styles for the current grade
  const { icon, color, bg } = getGradeStyle();

  return (
    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {t("qcAccuracy.qcAccuracyResult", "QC Accuracy Result")}
      </h3>

      {/* Responsive grid: 2 columns on small screens, 4 on medium and up */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-2 items-center justify-items-center">
        {/* --- 1. DEFECT POINTS --- */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.totalDefectPoints", "Total Defect Points")}
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {totalDefectPoints.toFixed(1)}
          </p>
        </div>
        {/* --- 2. ACCURACY --- */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.accuracy", "Accuracy")}
          </p>
          {/* Color matches the Pass/Fail result for consistency */}
          <p className={`text-3xl font-bold ${resultStyle.color}`}>
            {accuracy}%
          </p>
        </div>

        {/* --- 3. GRADE (The Circle) --- */}
        <div
          className={`text-center p-4 rounded-full flex flex-col items-center justify-center w-24 h-24 ${bg}`}
        >
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.grade", "Grade")}
          </span>
          <div className="flex items-center gap-1 mt-1">
            {icon}
            <span className={`text-3xl font-extrabold ${color}`}>{grade}</span>
          </div>
        </div>

        {/* --- 4. RESULT (Pass/Fail) --- */}
        <div
          className={`p-4 rounded-lg flex flex-col items-center justify-center w-full h-24 ${resultStyle.bg}`}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t("qcAccuracy.result", "Result")}
          </p>
          <div
            className={`flex items-center gap-1.5 mt-1 ${resultStyle.color}`}
          >
            {resultStyle.icon}
            <span className="text-2xl font-bold tracking-wider">
              {resultStyle.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyResult;
