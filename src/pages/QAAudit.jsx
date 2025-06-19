import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// --- STEP 1: Import all the components ---
import CuttingFusingAudit from "../components/inspection/audit/CuttingFusingAudit";
import EmbellishmentsAudit from "../components/inspection/audit/EmbellishmentsAudit";
import FabricAudit from "../components/inspection/audit/FabricAudit";
import FinishingPackingAudit from "../components/inspection/audit/FinishingPackingAudit";
import PUOV from "../components/inspection/audit/PUOV";
import ProductSafetyAudit from "../components/inspection/audit/ProductSafetyAudit";
import ProductionSewingAudit from "../components/inspection/audit/ProductionSewingAudit";
import QMSAudit from "../components/inspection/audit/QMSAudit";
import SampleAndPatternAudit from "../components/inspection/audit/SampleAndPatternAudit";
import TrimsAudit from "../components/inspection/audit/TrimsAudit";

// Import Lucide Icons
import {
  BookCheck,
  ClipboardCheck,
  DraftingCompass,
  Factory,
  GraduationCap,
  Info,
  Layers,
  PackageCheck,
  Scissors,
  ScissorsLineDashed,
  ShieldAlert,
  Sparkles,
  Wrench
} from "lucide-react";

const QAAudit = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // This placeholder is now only for the last two tabs
  const PlaceholderComponent = ({ tabKey }) => (
    <div className="p-10 text-center">
      <Info size={48} className="mx-auto mb-4 text-gray-400" />
      <h2 className="text-xl font-semibold text-gray-700">{t(tabKey)}</h2>
      <p className="text-gray-500">
        {t(
          "qaAudit.contentComingSoon",
          "Content for this section is under development."
        )}
      </p>
    </div>
  );

  // --- STEP 2: Update the `component` property for each tab ---
  const TABS = useMemo(
    () => [
      {
        id: "puov",
        labelKey: "qaAudit.tabs.puov",
        icon: <Factory size={16} />,
        component: <PUOV />
      },
      {
        id: "qms",
        labelKey: "qaAudit.tabs.qms",
        icon: <BookCheck size={16} />,
        component: <QMSAudit />
      },
      {
        id: "fabric",
        labelKey: "qaAudit.tabs.fabric",
        icon: <Layers size={16} />,
        component: <FabricAudit />
      },
      {
        id: "trims",
        labelKey: "qaAudit.tabs.trims",
        icon: <Scissors size={16} />,
        component: <TrimsAudit />
      },
      {
        id: "samplePatternRoom",
        labelKey: "qaAudit.tabs.samplePatternRoom",
        icon: <DraftingCompass size={16} />,
        component: <SampleAndPatternAudit />
      },
      {
        id: "embellishments",
        labelKey: "qaAudit.tabs.embellishments",
        icon: <Sparkles size={16} />,
        component: <EmbellishmentsAudit />
      },
      {
        id: "cuttingFusing",
        labelKey: "qaAudit.tabs.cuttingFusing",
        icon: <ScissorsLineDashed size={16} />,
        component: <CuttingFusingAudit />
      },
      {
        id: "productionSewing",
        labelKey: "qaAudit.tabs.productionSewing",
        icon: <Wrench size={16} />,
        component: <ProductionSewingAudit />
      },
      {
        id: "finishingPacking",
        labelKey: "qaAudit.tabs.finishingPacking",
        icon: <PackageCheck size={16} />,
        component: <FinishingPackingAudit />
      },
      {
        id: "productSafety",
        labelKey: "qaAudit.tabs.productSafety",
        icon: <ShieldAlert size={16} />,
        component: <ProductSafetyAudit />
      },
      {
        id: "cap",
        labelKey: "qaAudit.tabs.cap",
        icon: <ClipboardCheck size={16} />,
        component: <PlaceholderComponent tabKey="qaAudit.tabs.cap" /> // Keep as placeholder for now
      },
      {
        id: "finalScore",
        labelKey: "qaAudit.tabs.finalScore",
        icon: <GraduationCap size={16} />,
        component: <PlaceholderComponent tabKey="qaAudit.tabs.finalScore" /> // Keep as placeholder for now
      }
    ],
    [t]
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 pt-4 md:pt-6 pb-3 md:pb-4 text-center border-b border-gray-200">
          {t("qaAudit.pageTitle")}
        </h1>

        <div className="flex flex-wrap border-b-2 border-gray-200 text-xs sm:text-sm overflow-x-auto">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-3 sm:px-4 sm:py-3.5 focus:outline-none whitespace-nowrap transition-colors duration-150
                          ${
                            activeTab === index
                              ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
              onClick={() => setActiveTab(index)}
            >
              {React.cloneElement(tab.icon, { className: "shrink-0" })}
              <span>{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>
        <div className="tabs-content">
          {TABS.map((tab, index) => (
            <div
              key={tab.id}
              className={`${activeTab === index ? "block" : "hidden"}`}
            >
              {tab.component}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QAAudit;
