import purchaseSchema from "./purchase.schema.js";
import languageSchema from "./language.schema.js";

const styleSchema = {
    code: { 
        label: languageSchema,
        value: languageSchema
    },
    sample: {
        img: {
            type: Buffer
        },
        description: languageSchema
    }
}


const customerSchema = {
    style: styleSchema,
    purchase:  purchaseSchema,
    packing: {
        mark: {
            label: languageSchema,
            value: languageSchema
        },
        main: {
            label: languageSchema,
            value: languageSchema
        }
    },
    manufacturingNote:  [languageSchema]
}

export default customerSchema;