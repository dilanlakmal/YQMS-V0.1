import { GenericMasterData } from "../../components/GenericMasterData";

export function CostPrice() {
  return (
    <GenericMasterData
      endpoint="cost-price"
      title="Cost Price"
      columns={["No", "Cost Price", "Set Percent", "Washing Price", "Description", "Remark", "Actions"]}
      formFields={[
        { name: "Cost_Price", label: "Cost Price", required: true, type: "number" },
        { name: "Set_Percent", label: "Set Percent", required: true, type: "number" },
        { name: "Washing_Price", label: "Washing Price", required: true, type: "number" },
        { name: "Description", label: "Description", required: false, type: "textarea" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Cost_Price"
    />
  );
}

