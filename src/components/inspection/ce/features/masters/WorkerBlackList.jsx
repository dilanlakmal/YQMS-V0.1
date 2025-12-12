import { GenericMasterData } from "../../components/GenericMasterData";

export function WorkerBlackList() {
  return (
    <GenericMasterData
      endpoint="worker-blacklist"
      title="Worker Black List"
      columns={["No", "Worker Name", "Status", "Actions"]}
      formFields={[
        { name: "workerId", label: "Worker ID", required: true, type: "text" },
        { name: "workerName", label: "Worker Name", required: true, type: "text" },
        { name: "reason", label: "Reason", required: false, type: "text" },
        { name: "blacklistDate", label: "Blacklist Date", required: false, type: "date" },
        { name: "status", label: "Status", required: true, type: "select", options: ["Active", "Inactive"] }
      ]}
      displayField="workerName"
      statusField="status"
    />
  );
}

