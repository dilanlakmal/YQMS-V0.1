import mongoose from "mongoose";

const languageSchema = {
    khmer: {type: String, default: ""},
    english: {type: String, default: ""},
    chinese: {type: String, default: ""}
}

export default languageSchema;