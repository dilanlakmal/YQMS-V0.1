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
    status: {
        type: String
    }
})

export default function documentModel(connection){
    return connection.model("pt_document", documentSchema);
}