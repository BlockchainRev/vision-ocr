import { ocr } from "../src/index";

async function main() {
  let json = await ocr({
    filePath:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/ReceiptSwiss.jpg/1920px-ReceiptSwiss.jpg",
    // filePath: "./test/trader-joes-receipt.jpg",
    apiKey: process.env.GROQ_API_KEY,
  });

  console.log(json);
}

main();
