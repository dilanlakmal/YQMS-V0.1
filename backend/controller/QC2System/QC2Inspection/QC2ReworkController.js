import {
  QC2Reworks,       
} from "../../MongoDB/dbConnectionController.js";


/* ------------------------------
   QC2 - Reworks
------------------------------ */

// Endpoint to save reworks (reject garment) data
export const saveQC2ReworksData = async (req, res) => {
     try {
        const {
          package_no,
          //bundleNo,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          reworkGarments,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id
        } = req.body;
    
        const newRecord = new QC2Reworks({
          package_no,
          //bundleNo,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          reworkGarments,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id
        });
        await newRecord.save();
        res.status(201).json({
          message: "Reworks data saved successfully",
          data: newRecord
        });
      } catch (error) {
        console.error("Error saving reworks data:", error);
        res.status(500).json({
          message: "Failed to save reworks data",
          error: error.message
        });
      }
};

