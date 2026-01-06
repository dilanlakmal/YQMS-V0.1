import createProduction from "../production.controller.js";

const textSchema = (description, originLang = "english", type= "string", ) => {
    const language = {
        khmer: {
            type: type,
            description: description + " in khmer"
        },
        english: {
            type: type,
            description: description + " in english"
        },
        chinese: {
            type: type,
            description: description + " in chinese"
        }        
    }
    return {
        type: "object",
        properties: {
            [originLang]: language[originLang]
        },
        required: [originLang]
    }
} 



const titleSchema = (originLang) => ({
    type: "object",
    properties: {
        text: textSchema("The main title or the first text of the given text.", originLang)
    }
}
)

const styleSchema = (originLang) => ({
    type: "object",
    properties: {
        code: {
            type: "object",
            properties: {
                label: textSchema("Label for the style number assigned by the customer.", originLang),
                value: textSchema("The actual customer style number from the document.", originLang)
            },
            required: ["label", "value"]
        }
    },
    required: ["code"]
})

const orderSchema = (originLang) => ({
    type: "object",
    properties: {
        orderNumber: {
            type: "object",
            properties: {
                label: textSchema(
                    "Extract the field name or label that refers to the order number (e.g., 'Order No', 'PO#', 'Purchase Order').",
                    originLang
                    ),
                value: textSchema(
                    "Extract the actual order number value exactly as shown in the document. Do not modify or infer missing characters.",
                    originLang
                    )
            },
            required: ["label", "value"]
        },
        orderType: {
            type: "object",
            properties: {
                value: textSchema("Order type (e.g., 'Retail单').", originLang),
            },
            required: ["value"]
        }
    },
    required: ["orderNumber", "orderType"]
})

const purchaseSchema = (originLan) => ({
    type: "object",
    properties: {
        order: orderSchema(originLan),
        quantity: {
            type: "object",
            properties: {
                label: textSchema(
                    "Extract the field name or label that refers to quantity (e.g., 'Qty', 'Quantity', 'Total Quantity').",
                    originLan
                    ),
                value: textSchema(
                    "Extract the numeric quantity value only. Return a whole number without units or text.",
                    originLan,
                    "integer"
                    ),
                unit: textSchema("a unit of quantity", originLan)
            },
            required: ["label", "value", "unit"]
        },

    },
    required: ["order", "quantity"]
});


const remarkSchema = (originLang) => ({
    type: "object",
    properties: {
        value: textSchema("Labeling or marking instruction indicating required information to be printed on labels or shipping marks, such as PO number and customer name.", originLang)
    },
    required: ["value"]
})

const manufacturingNoteSchema = (originLang) => ({
    type: "array",
    items: textSchema(
        "A single production-related instruction. May include printing details, quantity rules, or references to attachments. Example: '1. GPRT00077C W02-490014 前幅印花(PP办评语看附页明细)'",
        originLang
    ),
    description: "Special or production-related instructions as an array of strings. Each item represents a single instruction or remark, allowing multiple numbered items, quantity rules, printing details, and references to attachments."
});

// const sampleSchema = {
//     type: ""
// }

const customerSchema = (originLang) => ({
    type: "object",
    properties: {
        style: styleSchema(originLang),
        purchase: purchaseSchema(originLang),
        remark: remarkSchema(originLang),
        manufacturingNote: manufacturingNoteSchema(originLang),
        // sample: sampleSchema
    },
    required: ["style", "purchase", "remark", "manufacturingNote"]
})

const factoryIDSchema = (originLang) => ({
    type: "object", 
    properties: {
        label: textSchema("Field label for factory code, usually written as '廠號'.", originLang),
        value: textSchema("Factory or manufacturer identifier code associated with the order.", originLang)
    },
    required: ["label", "value"]
})

const factorySchema = (originLang) => ({
    type: "object",
    properties: {
        factoryID: factoryIDSchema(originLang)
    },
    required: ["factoryID"]
})

const coverJson = (originLang) => ({
    type: "object",
    properties: {
        title: titleSchema(originLang),
        customer: customerSchema(originLang),
        factory: factorySchema(originLang)
    },
    required: ["title", "customer", "factory"]
})

const cover2Production = async (
    fieldExtracted, 
    originLang,
    documentId
) => {
    const title = fieldExtracted.title.text;
    const customer = fieldExtracted.customer;
    const CustomerStyle = customer.style;
    const customerPurchase = customer.purchase;
    const customerPurchaseOrder = customerPurchase.order;
    const customerPurchaseQuantity = customerPurchase.quantity;
    const customerRemark = customer.remark;
    const customerManufacturingNote = customer.manufacturingNote;
    const factory = fieldExtracted.factory;
    const factoryID = factory.factoryID;

    await createProduction(
        originLang,
        documentId,
        title,
        CustomerStyle.code.label,
        CustomerStyle.code.value,
        customerPurchaseOrder.orderNumber.label,
        customerPurchaseOrder.orderNumber.value,
        customerPurchaseOrder.orderType.value,
        customerPurchaseQuantity.label,
        customerPurchaseQuantity.value,
        customerPurchaseQuantity.unit,
        customerRemark,
        customerManufacturingNote,
        factoryID.label,
        factoryID.value,
    )
}

export default coverJson;
export {cover2Production};