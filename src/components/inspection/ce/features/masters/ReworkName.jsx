import { GenericMasterData } from "../../components/GenericMasterData";

export function ReworkName() {
  return (
    <GenericMasterData
      endpoint="rework-name"
      title="Rework Name"
      columns={["No", "Rework Code", "Rework Dept", "Rework Name", "Description", "Remark", "Actions"]}
      formFields={[
        { name: "Rework_Code", label: "Rework Code", required: true, type: "text" },
        { name: "Rework_Dept", label: "Rework Dept", required: true, type: "text" },
        { name: "Rework_Name", label: "Rework Name", required: true, type: "text" },
        { name: "Description", label: "Description", required: false, type: "textarea" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Rework_Name"
    />
  );
}

