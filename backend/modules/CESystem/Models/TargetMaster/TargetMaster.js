import mongoose from "mongoose";

const targetMasterSchema = new mongoose.Schema(
    {
        Area: { type: String },
        Standard_Code: { type: String },
        Target_Code: { type: String, required: true, unique: true },
        Chiness_Name: { type: String },
        Khmer_Name: { type: String },
        Fabric_Type: { type: mongoose.Schema.Types.ObjectId, ref: "ce_fabrictype" },
        Machine_Code: { type: mongoose.Schema.Types.ObjectId, ref: "ce_machine" },
        Dept_Type: { type: String },
        GST_SAM: { type: Number },
        Product_SAM: { type: Number },
        Description: { type: String },
        Set_TimeOut: { type: Number },
        Confirm_Date: { type: Date },
        Prepared_By: { type: String },
        Remark: { type: String }
    },
    {
        timestamps: true
    }
);

export default (connection) => connection.models.ce_targetmaster ||
    connection.model("ce_targetmaster", targetMasterSchema, "ce_targetmaster");
