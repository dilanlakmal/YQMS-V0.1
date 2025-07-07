import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { calculateAccuracy } from "./aqlHelper";
import { Target, Medal, Award, Star, ShieldX } from "lucide-react";

const AccuracyResult = ({ defects, checkedQty }) => {
  const { t } = useTranslation();
  const { accuracy, grade, totalDefectPoints } = useMemo(
    () => calculateAccuracy(defects, checkedQty),
    [defects, checkedQty]
  );

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
        return {
          icon: <ShieldX className="text-red-400" />,
          color: "text-red-400",
          bg: "bg-red-500/10"
        };
      default:
        return {
          icon: <Target />,
          color: "text-gray-400",
          bg: "bg-gray-500/10"
        };
    }
  };

  const { icon, color, bg } = getGradeStyle();

  return (
    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        {t("qcAccuracy.qcAccuracyResult", "QC Accuracy Result")}
      </h3>
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.totalDefectPoints", "Total Defect Points")}
          </p>
          <p className="text-2xl font-bold">{totalDefectPoints.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.accuracy", "Accuracy")}
          </p>
          <p className={`text-3xl font-bold ${color}`}>{accuracy}%</p>
        </div>
        <div
          className={`text-center p-4 rounded-full flex flex-col items-center justify-center w-24 h-24 ${bg}`}
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("qcAccuracy.grade", "Grade")}
          </span>
          <div className="flex items-center gap-1">
            {icon}
            <span className={`text-3xl font-extrabold ${color}`}>{grade}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyResult;
