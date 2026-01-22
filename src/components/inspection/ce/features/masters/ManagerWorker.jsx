import { GenericMasterData } from "../../components/GenericMasterData";

export function ManagerWorker() {
  return (
    <GenericMasterData
      endpoint="manager-worker"
      title="Manager Worker"
      columns={["No", "Employee ID", "Eng Name", "Kh Name", "Gender", "Position", "Status", "Control Line", "Price", "Remark", "Actions"]}
      columnFieldMap={{
        "Employee ID": "Employee_ID",
        "Eng Name": "Eng_Name",
        "Kh Name": "Kh_Name",
        "Control Line": "Control_Line"
      }}
      formFields={[
        { name: "Employee_ID", label: "Employee ID", required: true, type: "text" },
        { name: "Eng_Name", label: "English Name", required: true, type: "text" },
        { name: "Kh_Name", label: "Khmer Name", required: false, type: "text" },
        { name: "Gender", label: "Gender", required: false, type: "select", options: ["Male", "Female"] },
        { name: "Position", label: "Position", required: false, type: "text" },
        { name: "Status", label: "Status", required: false, type: "select", options: ["Working", "Stop"] },
        { name: "Control_Line", label: "Control Line", required: false, type: "text" },
        { name: "Price", label: "Price", required: false, type: "number " },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      showDisplayFieldColumn={false}
      formGridColumns={2}
      dialogWidthClass="sm:max-w-4xl"
    />
  );
}

