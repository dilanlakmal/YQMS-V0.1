import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    data: {type: Buffer},
    contentType: {type: String, default: "img/png"},
    description: {type: String, default: ""}
})

const extractionSchema = new mongoose.Schema({
    documentId: {type: String, default: ''},
    customer: {type: String},
    pageNumber: {type: Number},
    content: {type: String},
    originLang: {type: String},
    pdfData: {type: Buffer, require: true},
    pdfContentType: {type: String, default: "application/pdf"},
    images: {type: [imageSchema], default: []},
    status: {type: String, default: "created"}
}, {timestamps: true})

export default function createPageExtractionModel(connection) {
    return connection.model("pt_page_extractions", extractionSchema);
}   