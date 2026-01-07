import purchaseSchema from "./purchase.schema.js";
import languageSchema from "./language.schema.js";

const styleSchema = {
    code: { 
        label: languageSchema,
        value: languageSchema
    }
}


const customerSchema = {
    style: styleSchema,
    purchase:  purchaseSchema,
    remark: {
        value: languageSchema
    },
    manufacturingNote:  [languageSchema]
}

export default customerSchema;