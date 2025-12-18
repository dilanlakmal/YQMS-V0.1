import tools, { func_params, properties }from "../tool.controller.js";
import { QCAccuracyReportModel } from "../../MongoDB/dbConnectionController.js";

function fetchQCReport () {

}

export const getMoNumber = async () => {
    try{
        const docs = await QCAccuracyReportModel.find({}, { moNo: 1, _id: 0 });
        const moNumbers = [...new Set(docs.map(doc =>doc.moNo))].join(", ");
        console.log(moNumbers);
        return moNumbers;
    } catch (error) {
        console.error(error);
        return "";
    }

};


const function_param = func_params(null, null)
export const getMoNumberTools = [tools("getMoNumber", "Get list of moNumber of QC accuracy report", function_param)]
