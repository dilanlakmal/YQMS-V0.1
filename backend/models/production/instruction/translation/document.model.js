import mongoose from "mongoose";


const documentSchema = new mongoose.Schema({
    customer: {
        type: String,
    },
    type: {
        type: String,
        required: true,
        enum: ["instruction", "glossary"]
    },
    filename: {
        type: String
    },
    filePath: {
        type: String
    },
    pageCount: {
        type: Number
    },
    images: [
        {
            pageNumber: {
                type: Number, default: null
            },
            pdfPath: String,
            imageCount: {
                type: Number, default: null
            },
            imagePaths: [String]
        }
    ],
    status: {
        type: String,
        enum: ["created", "splitted", "imageExtracted", "contentExtracted"]
    }
})

export default function documentModel(connection){
    return connection.model("pt_document", documentSchema);
}