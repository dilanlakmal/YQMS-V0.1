/**
 * Utility functions for building Tool Definitions (JSON Schema for Function Calling)
 */

export const createProperty = (type, description, enumValues = null) => {
    const prop = { type, description };
    if (enumValues) prop.enum = enumValues;
    return prop;
};

export const createParams = (required = [], properties = {}) => {
    return {
        type: "object",
        properties,
        required
    };
};

export const defineTool = (name, description, parameters = {}) => {
    return {
        type: "function",
        function: {
            name,
            description,
            parameters: Object.keys(parameters).length ? parameters : { type: "object", properties: {} }
        }
    };
};
