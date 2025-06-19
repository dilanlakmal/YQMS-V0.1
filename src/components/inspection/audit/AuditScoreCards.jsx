import { Award, TrendingUp } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

// The ScoreCard visual component is now local to this file.
const ScoreCard = ({ title, value, icon, colorClass = "bg-blue-500" }) => (
  <div className={`p-4 rounded-lg shadow-md text-white ${colorClass}`}>
    <div className="flex items-center mb-2">
      {icon && React.cloneElement(icon, { size: 20, className: "mr-2" })}
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
    <p className="text-2xl font-bold text-center">{value}</p>
  </div>
);

const AuditScoreCards = ({
  maxScore,
  maxPossibleScore,
  totalScoreAchieved,
  sectionEnabled
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`grid md:grid-cols-3 gap-4 mx-4 sm:mx-6 my-6 ${
        !sectionEnabled ? "opacity-60" : ""
      }`}
    >
      <ScoreCard
        title={t("auditTable.maxScoreCardTitle", "Maximum Score")}
        value={maxScore}
        icon={<Award />}
        colorClass="bg-blue-500"
      />
      <ScoreCard
        title={t("auditTable.maxPossibleScoreCardTitle", "Possible Score")}
        value={maxPossibleScore}
        icon={<TrendingUp />}
        colorClass="bg-yellow-500"
      />
      <ScoreCard
        title={t("auditTable.totalScoreCardTitle", "Total Score Achieved")}
        value={totalScoreAchieved}
        icon={<TrendingUp />}
        colorClass="bg-green-500"
      />
    </div>
  );
};

export default AuditScoreCards;
