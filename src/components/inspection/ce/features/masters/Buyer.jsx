import { GenericMasterData } from "../../components/GenericMasterData";

export function Buyer() {
  return (
    <GenericMasterData
      endpoint="buyer-name"
      title="Buyer"
      columns={["No", "Buyer", "Pallet CTN", "Remark", "Actions"]}
      formFields={[
        { name: "Buyer_Name", label: "Buyer", required: true, type: "text" },
        { name: "PalletCTN", label: "Pallet CTN", required: true, type: "number" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Buyer_Name"
    />
  );
}

