import { GenericMasterData } from "../../components/GenericMasterData";

export function SetGrade() {
  return (
    <GenericMasterData
      endpoint="set-grade"
      title="Set Grade"
      columns={["No", "Grade", "Percentage", "Description", "Remark", "Actions"]}
      formFields={[
        { name: "Grade", label: "Grade", required: true, type: "text" },
        { name: "Percentage", label: "Percentage", required: true, type: "number" },
        { name: "Description", label: "Description", required: false, type: "textarea" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Grade"
      showDisplayFieldColumn={false}
    />
  );
}

