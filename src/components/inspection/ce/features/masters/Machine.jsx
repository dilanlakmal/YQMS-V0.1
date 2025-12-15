import { GenericMasterData } from "../../components/GenericMasterData";

export function Machine() {
  return (
    <GenericMasterData
      endpoint="machine"
      title="Machine"
      columns={["No", "Machine Code", "English Name", "Chinese Name", "Khmer Name", "Machine Type", "Brand Code", "Model Code", "Actions"]}
      formFields={[
        { name: "Machine_Code", label: "Machine Code", required: true, type: "text" },
        { name: "Eng_Name", label: "English Name", required: false, type: "text" },
        { name: "Ch_Name", label: "Chinese Name", required: false, type: "text" },
        { name: "Kh_Name", label: "Khmer Name", required: false, type: "text" },
        { name: "Machine_Type", label: "Machine Type", required: false, type: "text" },
        { name: "Brand_Code", label: "Brand Code", required: false, type: "text" },
        { name: "Model_Code", label: "Model Code", required: false, type: "text" },
        { name: "Description", label: "Description", required: false, type: "textarea", colSpan: 2 },
        { name: "Remarks", label: "Remarks", required: false, type: "textarea", colSpan: 2 }
      ]}
      formGridColumns={2}
      displayField="Eng_Name"
      showDisplayFieldColumn={false}
      dialogWidthClass="sm:max-w-3xl"
      columnFieldMap={{
        "Chinese Name": "Ch_Name",
        "Khmer Name": "Kh_Name",
        "Machine Type": "Machine_Type",
        "Brand Code": "Brand_Code",
        "Model Code": "Model_Code"
      }}
    />
  );
}

