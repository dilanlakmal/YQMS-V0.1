import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    data: {type: Buffer},
    contentType: {type: String, default: "img/png"},
    description: {type: String, default: ""}
})

const extractionSchema = new mongoose.Schema({
    customer: {type: String},
    pageNumber: {type: Number},
    content: {type: String},
    originLang: {type: String},
    pdfData: {type: Buffer, require: true},
    pdfContentType: {type: String, default: "application/pdf"},
    images: {type: [imageSchema], default: []}
}, {timestamps: true})

export default function createConversationModel(connection) {
    return connection.model("pt_extract", extractionSchema);
}   