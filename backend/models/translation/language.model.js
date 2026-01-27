import mongoose from "mongoose";
import { Schema } from "mongoose";


const languageSchema = Schema({
    code: String,
    name: String
})

export default mongoose.model("language", languageSchema);