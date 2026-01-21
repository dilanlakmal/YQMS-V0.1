import { deskLamp } from "@lucide/lab";
import languageSchema from "./language.schema.js";

const factorySchema = {
    factoryID: {
        value: languageSchema,
        label: languageSchema        
    },
    factoryStamp: {
        img: Buffer,
        description: languageSchema
    }

}

export default factorySchema;