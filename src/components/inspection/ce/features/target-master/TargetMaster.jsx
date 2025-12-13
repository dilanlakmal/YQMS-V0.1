import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../../config";
import { GenericMasterData } from "../../components/GenericMasterData";

export function TargetMaster({ onImport }) {
    const [fabricOptions, setFabricOptions] = useState([]);
    const [machineOptions, setMachineOptions] = useState([]);
    const [deptOptions, setDeptOptions] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Fetch Fabric Types
                const fabricRes = await axios.get(`${API_BASE_URL}/api/ce-master/fabric-type`);
                if (Array.isArray(fabricRes.data)) {
                    setFabricOptions(fabricRes.data.map(item => ({
                        label: item.Fabric_Type,
                        value: item._id
                    })));
                }

                // Fetch Machine Codes
                const machineRes = await axios.get(`${API_BASE_URL}/api/ce-master/machine`);
                if (Array.isArray(machineRes.data)) {
                    setMachineOptions(machineRes.data.map(item => ({
                        label: item.Machine_Code,
                        value: item._id
                    })));
                }

                // Fetch Dept Types
                const deptRes = await axios.get(`${API_BASE_URL}/api/ce-master/department/distinct/types`);
                setDeptOptions(deptRes.data || []);
            } catch (error) {
                console.error('Error fetching dropdown options:', error);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        fetchOptions();
    }, []);

    if (isLoadingOptions) {
        return <div>Loading...</div>;
    }

    return (
        <GenericMasterData
            endpoint="target-master"
            apiBasePath="/api/ce-target-master/"
            columns={[
                "No",
                "Area",
                "Standard Code",
                "Target Code",
                "Chinese Name",
                "Khmer Name",
                "Fabric Type",
                "Machine Code",
                "Dept Type",
                "GST SAM",
                "Product SAM",
                "Actions"
            ]}
            formFields={[
                { name: "Area", label: "Area", required: false, type: "select", options: ["裁床", "烫标", "车缝", "整烫", "品检", "包装", "洗水"] },
                { name: "Target_Code", label: "Target Code", required: true, type: "text" },
                { name: "Standard_Code", label: "Standard Code", required: false, type: "text" },
                { name: "Chiness_Name", label: "Chinese Name", required: false, type: "text" },
                { name: "Khmer_Name", label: "Khmer Name", required: false, type: "text" },
                { name: "Fabric_Type", label: "Fabric Type", required: false, type: "select", options: fabricOptions },
                { name: "Machine_Code", label: "Machine Code", required: false, type: "select", options: machineOptions },
                { name: "Dept_Type", label: "Department Type", required: false, type: "select", options: deptOptions },
                { name: "GST_SAM", label: "GST SAM", required: false, type: "number" },
                { name: "Product_SAM", label: "Product SAM", required: false, type: "number" },
                { name: "Set_TimeOut", label: "Set TimeOut (minutes)", required: false, type: "number" },
                { name: "Confirm_Date", label: "Confirm Date", required: false, type: "date" },
                // { name: "Prepared_By", label: "Prepared By", required: false, type: "text", disabled: true },
                { name: "Remark", label: "Remark", required: false, type: "textarea", colSpan: 2 },
                { name: "Description", label: "Description", required: false, type: "textarea", colSpan: 2 },
            ]}
            formGridColumns={2}
            displayField="Target_Code"
            showDisplayFieldColumn={false}
            dialogWidthClass="sm:max-w-4xl"
            columnFieldMap={{
                "Standard Code": "Standard_Code",
                "Target Code": "Target_Code",
                "Chinese Name": "Chiness_Name",
                "Khmer Name": "Khmer_Name",
                "Fabric Type": (row) => row.Fabric_Type?.Fabric_Type || (typeof row.Fabric_Type === 'string' ? row.Fabric_Type : "-"),
                "Machine Code": (row) => row.Machine_Code?.Machine_Code || (typeof row.Machine_Code === 'string' ? row.Machine_Code : "-"),
                "Dept Type": "Dept_Type",
                "GST SAM": "GST_SAM",
                "Product SAM": "Product_SAM"
            }}
            enableSearch={true}
            searchPlaceholder="Search by target code, area, machine code..."
            searchFields={["Target_Code", "Area", "Standard_Code", "Machine_Code", "Chiness_Name", "Khmer_Name"]}
            filterConfigs={[
                {
                    field: "Dept_Type",
                    label: "Department Type",
                    distinctEndpoint: "department/distinct/types"
                },
                {
                    field: "Fabric_Type",
                    label: "Fabric Type",
                    apiEndpoint: "fabric-type",
                    valueField: "Fabric_Type"
                },
                {
                    field: "Machine_Code",
                    label: "Machine",
                    type: "combobox",
                    apiEndpoint: "machine",
                    valueField: "Machine_Code"
                }
            ]}
            enableExport={true}
            enableImport={true}
            onImport={onImport}
            enablePagination={true}
            itemsPerPage={13}
        />
    );
}
