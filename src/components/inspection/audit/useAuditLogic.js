import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";

// This helper can live inside the hook's file or be imported if used elsewhere.
const initializeInteractiveAuditItemShell = (staticRequirementFromDB) => {
  const level = parseInt(staticRequirementFromDB.levelValue, 10) || 0;
  return {
    staticData: staticRequirementFromDB,
    ok: true,
    toImprove: false,
    na: false,
    observationData: {
      text: "",
      isTable: false,
      table: { rows: 2, cols: 2, data: [] }
    },
    images: [],
    mustHave: staticRequirementFromDB.mustHave,
    score: level,
    naScore: 0,
    uniqueId: staticRequirementFromDB._id || staticRequirementFromDB.no
  };
};

export const useAuditLogic = (mainTitle) => {
  const { t, i18n } = useTranslation();
  const [auditItems, setAuditItems] = useState([]);
  const [rawStaticSectionData, setRawStaticSectionData] = useState(null);
  const [sectionTitleForDisplay, setSectionTitleForDisplay] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaticData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/audit-checkpoints`);
      const allCheckpoints = response.data;
      const currentTabDataFromDB = allCheckpoints.find(
        (cp) => cp.mainTitle === mainTitle
      );

      if (currentTabDataFromDB) {
        setRawStaticSectionData(currentTabDataFromDB);
        const initializedItems = currentTabDataFromDB.requirements.map((req) =>
          initializeInteractiveAuditItemShell(req)
        );
        setAuditItems(initializedItems);
      } else {
        setError(
          t("common.dataNotFoundFor", { title: mainTitle }) ||
            `Audit data for "${mainTitle}" not found.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          t("common.fetchError", "Failed to fetch audit data")
      );
    } finally {
      setIsLoading(false);
    }
  }, [mainTitle, t]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  useEffect(() => {
    if (rawStaticSectionData) {
      const lang = i18n.language;
      switch (lang) {
        case "km":
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleKhmer);
          break;
        case "zh":
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleChinese);
          break;
        default:
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleEng);
      }
    }
  }, [rawStaticSectionData, i18n.language]);

  const handleAuditDataChange = (updatedData) => {
    setAuditItems(updatedData);
  };

  const maxScore = useMemo(
    () =>
      auditItems.reduce(
        (sum, item) => sum + (parseInt(item.staticData?.levelValue, 10) || 0),
        0
      ),
    [auditItems]
  );
  const maxPossibleScore = useMemo(() => {
    const totalLevelScore = auditItems.reduce(
      (sum, item) => sum + (parseInt(item.staticData?.levelValue, 10) || 0),
      0
    );
    const totalNaDeduction = auditItems.reduce(
      (sum, item) => sum + (parseInt(item.naScore, 10) || 0),
      0
    );
    return totalLevelScore - totalNaDeduction;
  }, [auditItems]);
  const totalScoreAchieved = useMemo(
    () =>
      auditItems.reduce(
        (sum, item) => sum + (parseInt(item.score, 10) || 0),
        0
      ),
    [auditItems]
  );

  return {
    isLoading,
    error,
    auditItems,
    handleAuditDataChange,
    sectionTitleForDisplay,
    currentLang: i18n.language,
    scores: {
      maxScore,
      maxPossibleScore,
      totalScoreAchieved
    },
    hasData: !!rawStaticSectionData || (auditItems.length > 0 && !isLoading)
  };
};
