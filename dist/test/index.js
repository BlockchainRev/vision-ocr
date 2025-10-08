"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    const inputPath = "/Users/samaylakhani/vision-ocr/test/106587.pdf";
    let markdown = await (0, index_1.ocr)({
        filePath: inputPath,
        apiKey: process.env.GROQ_API_KEY,
    });
    // Generate unique output filename based on input file and timestamp
    const inputName = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputPath = path_1.default.join(process.cwd(), 'output', `${inputName}_${timestamp}.md`);
    // Create output directory if it doesn't exist
    const outputDir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Write to file
    fs_1.default.writeFileSync(outputPath, markdown);
    console.log(`✓ Saved to: ${outputPath}`);
}
main();
