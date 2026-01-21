import createProductionModel from "../../models/production/production.model.js";
import { ymEcoConnection } from "../MongoDB/dbConnectionController.js";

const defaultValue = (defaultLang) => ({
    [defaultLang]: "",
});

const production = createProductionModel(ymEcoConnection);

const createProduction = async (
    originLang = "english",
    documentId = "",
    titleText = defaultValue(originLang),

    customerStyleCodeLabel = defaultValue(originLang),
    customerStyleCodeValue = defaultValue(originLang),

    customerStyleSampleImg = null,
    customerStyleSampleDescription = defaultValue(originLang),

    customerPurchaseOrderOrderNumberLabel = defaultValue(originLang),
    customerPurchaseOrderOrderNumberValue = defaultValue(originLang),

    customerPurchaseOrderOrderTypeLabel = defaultValue(originLang),
    customerPurchaseOrderOrderTypeValue = defaultValue(originLang),

    customerPurchaseQuantityLabel = defaultValue(originLang),
    customerPurchaseQuantityValue = defaultValue(originLang),
    customerPurchaseQuantityUnit = defaultValue(originLang),

    customerPurchaseSpecs = [],

    customerRemark = defaultValue(originLang),
    manufacturingNote = defaultValue(originLang),

    factoryIDLabel = defaultValue(originLang),
    factoryIDValue = defaultValue(originLang),

    factoryStampImg = null,
    factoryStampDescription = defaultValue(originLang)
) => {
    const payload = {
        documentId,
        title: {
            text: titleText,
        },
        customer: {
            style: {
                code: {
                    label: customerStyleCodeLabel,
                    value: customerStyleCodeValue,
                },
                sample: {
                    img: customerStyleSampleImg,
                    description: customerStyleSampleDescription
                }
            },
            purchase: {
                order: {
                    orderNumber: {
                        label: customerPurchaseOrderOrderNumberLabel,
                        value: customerPurchaseOrderOrderNumberValue,
                    },
                    orderType: {
                        label: customerPurchaseOrderOrderTypeLabel,
                        value: customerPurchaseOrderOrderTypeValue,
                    },
                },
                quantity: {
                    label: customerPurchaseQuantityLabel,
                    value: customerPurchaseQuantityValue,
                    unit: customerPurchaseQuantityUnit,
                },
                specs: customerPurchaseSpecs,
            },
            packing: {
                mark: {
                    label: customerRemark.mark.label,
                    value: customerRemark.mark.value,
                },
                main: {
                    label: customerRemark.main.label,
                    value: customerRemark.main.value,
                }
            },
            manufacturingNote,
        },
        factory: {
            factoryID: {
                label: factoryIDLabel,
                value: factoryIDValue,
            },
            factoryStamp: {
                img: factoryStampImg,
                description: factoryStampDescription
            }
        },
    };

    const doc = await production.findOneAndUpdate(
        { documentId },
        { $set: payload },
        {
            upsert: true,
            new: true,        // return updated document
            setDefaultsOnInsert: true,
        }
    );

    return doc;
};

const updateProduction = async (req, res) => {
    try { 
        const { id: documentId } = req.params;
        const updateData = req.body;
        
        const doc = await update(documentId, updateData);

        return res.status(200).json(doc);        
    } catch (err) {
        console.error("Error updating production:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};


const update = async (docId, updateData) => {
        const doc = await production.findOneAndUpdate(
            { documentId: docId },
            { $set: updateData },
            { new: true }
        );
        return doc;
}

const getProduction = async (prodId) => {
    const data = await production.findById(prodId);
    return data;
}

const getProductionByDocId = async (docId)  => {
    const data = await production.findOne({documentId: docId});
    return data;
}

export default createProduction;
export { updateProduction, getProduction, getProductionByDocId, update};