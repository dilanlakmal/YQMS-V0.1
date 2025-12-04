

export const properties = (type, description) => {
    return {
        type: type,
        description: description
    }
}

export const func_params = (type, required, properties) => {
    return {
        type: type,
        required: required,
        properties: properties
    }
}

const tool = (func_name, func_des, func_params) => ({
        type: "function",
        function: {
            name: func_name,
            description: func_des,
            parameters: func_params
        }
    })


export default tool;
