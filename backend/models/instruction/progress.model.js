import mongoose from "mongoose";
import { Schema } from "mongoose";


const progressSchema = Schema({
    title: {
        type: Schema.Types.ObjectId,
        ref: "content",
        required: true
    },
    description: {
        type: Schema.Types.ObjectId,
        ref: "content",
        required: true
    },
    icon: String,
    status: {
        type: String,
        enum: ["active", "inactive"]
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "users"
    }

})

export default mongoose.model("progress", progressSchema);