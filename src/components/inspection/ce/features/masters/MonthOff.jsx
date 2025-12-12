import { GenericMasterData } from "../../components/GenericMasterData";

export function MonthOff() {
  return (
    <GenericMasterData
      endpoint="month-off"
      title="Month Off"
      columns={["No", "Create Date", "Prepared By", "Worker Piece Rate", "Weekly Piece Rate", "Weekly Over Target", "Quality Bonus", "Remarks", "Actions"]}
      formFields={[
        { name: "Create_Date", label: "Create Date", required: true, type: "date" },
        { name: "Worker_Piece_Rate", label: "Worker Piece Rate", required: false, type: "date" },
        { name: "WeeKly_Piece_Rate", label: "Weekly Piece Rate", required: false, type: "date" },
        { name: "Weekly_Over_Target", label: "Weekly Over Target", required: false, type: "date" },
        { name: "Quality_Bonus", label: "Quality Bonus", required: false, type: "date" },
        { name: "Remarks", label: "Remarks", required: false, type: "textarea" }
      ]}
      showDisplayFieldColumn={false}
      formGridColumns={2}
      dialogWidthClass="sm:max-w-2xl"
    />
  );
}

