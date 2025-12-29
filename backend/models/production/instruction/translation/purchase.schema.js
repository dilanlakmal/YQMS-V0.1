import languageSchema from "./language.schema.js";

const orderSchema = {
    orderNumber: {type: {
        label: {type: languageSchema},
        value: {type: languageSchema}
    }},
    orderType: {type: {
        value: languageSchema
    }
    }
}

const quantitySchema = {
    label:  languageSchema,
    value: languageSchema,
    unit: languageSchema
}

const purchaseSchema = {
    order: orderSchema,
    quantity: quantitySchema
}


export default purchaseSchema;