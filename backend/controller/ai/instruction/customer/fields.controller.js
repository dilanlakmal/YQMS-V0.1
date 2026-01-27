import coverJson, {cover2Production} from "./gprt/conver.json.js";


const field = {
    customer: {
        type: {
            supported: ["GPRT0007C"]
        }
    },
    pages: [
        {
            pageNumber: 1,
            fields: coverJson,
            customer: "GPRT0007C",
            create: cover2Production
        }
    ]
}

export default field;