import { GenericMasterData } from "../../components/GenericMasterData";

export function Department() {
  return (
    <GenericMasterData
      endpoint="department"
      title="Department"
      columns={["No", "Dept Code", "Dept", "Section", "Wk Line", "Dept Type", "CPM Price", "Remark", "Actions"]}
      formFields={[
        { name: "Dept_Code", label: "Dept Code", required: true, type: "text" },
        { name: "Piece_Rate_Type", label: "Piece Rate Type", required: false, type: "text" },
        { name: "Dept", label: "Dept", required: true, type: "text" },
        { name: "Section", label: "Section", required: true, type: "text" },
        { name: "Wk_Line", label: "Wk Line", required: true, type: "text" },
        { name: "Borrow_Dept", label: "Borrow Dept", required: false, type: "text" },
        { name: "Dept_Type", label: "Dept Type", required: false, type: "text" },
        { name: "OutPut_Tg", label: "Output Tg", required: false, type: "text" },
        { name: "CPM_Price", label: "CPM Price", required: false, type: "number" },
        { name: "SubLine", label: "SubLine", required: false, type: "text" },
        { name: "Worker", label: "Worker", required: false, type: "text" },
        { name: "Remark", label: "Remark", required: false, type: "textarea" }
      ]}
      displayField="Dept"
      formGridColumns={2}
      dialogWidthClass="sm:max-w-4xl"
    />
  );
}

