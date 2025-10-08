"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    const inputPath = "/Users/samaylakhani/vision-ocr/test/image.png";
    console.log("🔍 Running multi-model extraction with confidence scoring...\n");
    const result = await (0, index_1.ocrWithConfidence)({
        filePath: inputPath,
        apiKey: process.env.GROQ_API_KEY,
    });
    // Generate unique output filename
    const inputName = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const outputPath = path_1.default.join(process.cwd(), "output", `${inputName}_confidence_${timestamp}.json`);
    // Create output directory if it doesn't exist
    const outputDir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Write full result to JSON
    fs_1.default.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    // Display summary
    if (!Array.isArray(result)) {
        console.log("📊 Extraction Summary:");
        console.log(`Overall Confidence: ${(result.confidence.overall * 100).toFixed(1)}%`);
        console.log(`Needs Review: ${result.needsReview ? "⚠️ YES" : "✅ NO"}`);
        if (result.reviewFields.length > 0) {
            console.log(`\n🔴 Fields requiring review: ${result.reviewFields.join(", ")}`);
        }
        console.log("\n📋 Extracted Data:");
        console.log(JSON.stringify(result.extractedData, null, 2));
        console.log("\n🔬 Field-level Confidence:");
        result.confidence.fieldLevel.forEach((fc) => {
            const icon = fc.agreementScore >= 0.85 ? "✅" : fc.agreementScore >= 0.65 ? "⚠️" : "🔴";
            console.log(`${icon} ${fc.field}: ${(fc.agreementScore * 100).toFixed(1)}% agreement`);
        });
        console.log("\n🤖 Model Results:");
        result.modelResults.forEach((mr) => {
            console.log(`- ${mr.model}`);
        });
    }
    else {
        console.log(`📄 Processed ${result.length} pages`);
        result.forEach((page, idx) => {
            console.log(`\nPage ${idx + 1}:`);
            console.log(`  Confidence: ${(page.confidence.overall * 100).toFixed(1)}%`);
            console.log(`  Needs Review: ${page.needsReview ? "⚠️ YES" : "✅ NO"}`);
        });
    }
    console.log(`\n✅ Full results saved to: ${outputPath}`);
}
main().catch(console.error);
