import createProduction from "../../../production.controller.js";

const textSchema = (description, originLang = "english", type = "string",) => {
    const language = {
        khmer: {
            type: type,
            description: description
        },
        english: {
            type: type,
            description: description
        },
        chinese: {
            type: type,
            description: description
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
                label: textSchema("Label for the Order type field, usually written as 'Order Type' or similar.", originLang),
                value: textSchema("the value of Order type (e.g., 'Retail单').", originLang),
            },
            required: ["label", "value"]
        }
    },
    required: ["orderNumber", "orderType"]
})

const purchaseSchema = (originLang) => ({
    type: "object",
    properties: {
        order: orderSchema(originLang),
        quantity: {
            type: "object",
            properties: {
                label: textSchema(
                    "Extract the field name or label that refers to quantity (e.g., 'Qty', 'Quantity', 'Total Quantity').",
                    originLang
                ),
                value: textSchema(
                    "Extract the numeric quantity value only. Return a whole number without units or text.",
                    originLang,
                    "integer"
                ),
                unit: textSchema("a unit of quantity", originLang)
            },
            required: ["label", "value", "unit"]
        },

    },
    required: ["order", "quantity"]
});


const packingSchema = (originLang) => ({
    type: "object",
    properties: {
        mark: {
            type: "object",
            properties: {
                label: textSchema("Label for the marking instruction, usually written as 'Retail'.", originLang),
                value: textSchema("The actual marking instruction or label value.", originLang)
            },
            required: ["label", "value"]
        },
        main: {
            type: "object",
            properties: {
                label: textSchema("Label for the main packing instruction, usually written as 'Main Packing'.", originLang),
                value: textSchema("The actual main packing instruction or label value.", originLang)
            },
            required: ["label", "value"]
        }
    },
    required: ["mark", "main"]
})

const manufacturingNoteSchema = (originLang) => ({
    type: "array",
    items: textSchema(
        "A single production-related instruction. May include printing details, quantity rules, or references to attachments.",
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
        packing: packingSchema(originLang),
        manufacturingNote: manufacturingNoteSchema(originLang),
        // sample: sampleSchema
    },
    required: ["style", "purchase", "packing", "manufacturingNote"]
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
    const customerRemark = customer.packing;
    console.log("customerRemark:", JSON.stringify(customerRemark, null, 2));
    const customerManufacturingNote = customer.manufacturingNote;
    const factory = fieldExtracted.factory;
    const factoryID = factory.factoryID;

    await createProduction(
        originLang,
        documentId,

        title,

        CustomerStyle.code.label,
        CustomerStyle.code.value,

        CustomerStyle.sample?.img,
        CustomerStyle.sample?.description,

        customerPurchaseOrder.orderNumber.label,
        customerPurchaseOrder.orderNumber.value,

        customerPurchaseOrder.orderType.label,
        customerPurchaseOrder.orderType.value,

        customerPurchaseQuantity.label,
        customerPurchaseQuantity.value,
        customerPurchaseQuantity.unit,

        customerPurchase?.specs,

        customerRemark,

        customerManufacturingNote,

        factoryID.label,
        factoryID.value,

        factory.factoryStamp?.img,
        factory.factoryStamp?.description
    )
}

export default coverJson;
export { cover2Production, textSchema };