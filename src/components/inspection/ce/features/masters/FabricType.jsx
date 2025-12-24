import { GenericMasterData } from "../../components/GenericMasterData";

export function FabricType() {
  return (
    <GenericMasterData
      endpoint="fabric-type"
      title="Fabric Type"
      columns={["No", "Fabric Type", "Description", "Remark", "Actions"]}
      formFields={[
        { name: "Fabric_Type", label: "Fabric Type", required: true, type: "text" },
        { name: "Description", label: "Description", required: false, type: "textarea" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Fabric_Type"
    />
  );
}

