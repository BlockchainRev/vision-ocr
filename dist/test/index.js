"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
async function main() {
    let json = await (0, index_1.ocr)({
        filePath: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/ReceiptSwiss.jpg/1920px-ReceiptSwiss.jpg",
        // filePath: "./test/trader-joes-receipt.jpg",
        apiKey: process.env.GROQ_API_KEY,
    });
    console.log(json);
}
main();
