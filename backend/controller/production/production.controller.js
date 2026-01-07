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

    customerPurchaseOrderOrderNumberLabel = defaultValue(originLang),
    customerPurchaseOrderOrderNumberValue = defaultValue(originLang),
    customerPurchaseOrderOrderType = defaultValue(originLang),

    customerPurchaseQuantityLabel = defaultValue(originLang),
    customerPurchaseQuantityValue = defaultValue(originLang),
    customerPurchaseQuantityUnit = defaultValue(originLang),

    customerRemark = defaultValue(originLang),
    manufacturingNote = defaultValue(originLang),

    factoryIDLabel = defaultValue(originLang),
    factoryIDValue = defaultValue(originLang)
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
            },
            purchase: {
                order: {
                    orderNumber: {
                        label: customerPurchaseOrderOrderNumberLabel,
                        value: customerPurchaseOrderOrderNumberValue,
                    },
                    orderType: {
                        value: customerPurchaseOrderOrderType,
                    },
                },
                quantity: {
                    label: customerPurchaseQuantityLabel,
                    value: customerPurchaseQuantityValue,
                    unit: customerPurchaseQuantityUnit,
                },
            },
            remark: customerRemark,
            manufacturingNote,
        },
        factory: {
            factoryID: {
                label: factoryIDLabel,
                value: factoryIDValue,
            },
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


export default createProduction;
