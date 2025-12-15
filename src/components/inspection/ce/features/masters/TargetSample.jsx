import { GenericMasterData } from "../../components/GenericMasterData";

export function TargetSample() {
  return (
    <GenericMasterData
      endpoint="target-sample"
      title="Target Sample"
      columns={["No", "DT Code", "Target Code", "Check Point", "Remark", "Actions"]}
      formFields={[
        { name: "DT_Code", label: "DT Code", required: true, type: "text" },
        { name: "Target_Code", label: "Target Code", required: false, type: "text" },
        { name: "Check_Point", label: "Check Point", required: false, type: "text" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Target_Code"
      showDisplayFieldColumn={false}
    />
  );
}

