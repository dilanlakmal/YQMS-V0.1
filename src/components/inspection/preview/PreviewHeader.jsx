import { useTranslation } from "react-i18next";

function PreviewHeader({ inspectionData }) {
  const {t} = useTranslation();
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="grid grid-cols-2 gap-4 ">
        <div>
          <p><span className="font-semibold">{t("bundle.date")}:</span> {inspectionData.date.toLocaleDateString()}</p>
          <p><span className="font-semibold">{t("bundle.factory")}:</span> {inspectionData.factory}</p>
          <p><span className="font-semibold">{t("bundle.line_no")}:</span> {inspectionData.lineNo}</p>
        </div>
        <div>
          <p><span className="font-semibold">{t("prevHeader.style")}:</span> {inspectionData.styleCode}{inspectionData.styleDigit}</p>
          <p><span className="font-semibold">{t("bundle.mono")}:</span> {inspectionData.moNo}</p>
          <p><span className="font-semibold">{t("details.customer")}:</span> {inspectionData.customer}</p>
        </div>
      </div>
    </div>
  );
}

export default PreviewHeader;
