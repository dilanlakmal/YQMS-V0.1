import coverJson, {cover2Production} from "./gprt/conver.json.js";


const field = {
    customer: {
        type: {
            supported: ["GPRT"]
        }
    },
    pages: [
        {
            pageNumber: 1,
            fields: coverJson,
            customer: "GPRT",
            create: cover2Production
        }
    ]
}

export default field;