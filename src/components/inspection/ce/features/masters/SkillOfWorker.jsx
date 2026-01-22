import { GenericMasterData } from "../../components/GenericMasterData";

// Generate line fields (Line01 to Line35)
const generateLineFields = () => {
  const lineFields = [];
  for (let i = 1; i <= 35; i++) {
    const lineNum = i.toString().padStart(2, '0');
    lineFields.push({
      name: `lines.Line${lineNum}`,
      label: `Line ${lineNum}`,
      required: false,
      type: "number"
    });
  }
  return lineFields;
};

export function SkillOfWorker() {
  return (
    <GenericMasterData
      endpoint="skill-of-worker"
      title="Skill Of Worker"
      columns={["No", "Machine Name", "All Sewing Worker", "Total Lines", "Diff", "Actions"]}
      formFields={[
        { name: "Machine_Name", label: "Machine Name", required: true, type: "text", colSpan: 2 },
        { name: "AllSewing_Worker", label: "All Sewing Worker", required: false, type: "number", colSpan: 2 },
        { type: "group", label: "Lines", name: "lines-group" },
        ...generateLineFields()
      ]}
      showDisplayFieldColumn={false}
      formGridColumns={4}
      dialogWidthClass="sm:max-w-6xl"
    />
  );
}

