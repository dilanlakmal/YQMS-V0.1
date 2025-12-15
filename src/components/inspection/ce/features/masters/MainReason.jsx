import { GenericMasterData } from "../../components/GenericMasterData";

export function MainReason() {
  return (
    <GenericMasterData
      endpoint="main-reason"
      title="Main Reason"
      columns={["No", "Reason", "Remark", "Actions"]}
      formFields={[
        { name: "Reason", label: "Main Reason", required: true, type: "text" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Reason"
      showDisplayFieldColumn={false}
    />
  );
}

