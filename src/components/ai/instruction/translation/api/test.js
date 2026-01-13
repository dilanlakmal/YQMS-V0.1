import { getProduction } from "./extraction.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // dev only
const pro = await getProduction("695f3be909351198aad33cd1");
console.log("pro", pro);
