"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocr = ocr;
exports.ocrWithConfidence = ocrWithConfidence;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const fs_1 = __importDefault(require("fs"));
const pdf_to_png_converter_1 = require("pdf-to-png-converter");
const ensemble_1 = require("./ensemble");
async function ocr({ filePath, apiKey = process.env.GROQ_API_KEY, model = "meta-llama/llama-4-scout-17b-16e-instruct", }) {
    if (!filePath) {
        throw new Error("filePath is required");
    }
    const groq = new groq_sdk_1.default({ apiKey: apiKey, dangerouslyAllowBrowser: true });
    // Check if PDF
    if (filePath.toLowerCase().endsWith('.pdf')) {
        return await processPDF({ groq, visionLLM: model, filePath });
    }
    let finalMarkdown = await getMarkDown({ groq, visionLLM: model, filePath });
    // Validate output
    if (!finalMarkdown || finalMarkdown.trim().length === 0) {
        throw new Error("No content was extracted from the image");
    }
    return finalMarkdown;
}
async function processPDF({ groq, visionLLM, filePath, }) {
    const tempDir = './temp_pdf_pages';
    // Create temp directory
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir, { recursive: true });
    }
    try {
        // Convert PDF to PNG images
        const pngPages = await (0, pdf_to_png_converter_1.pdfToPng)(filePath, {
            outputFolder: tempDir,
            verbosityLevel: 0
        });
        // Process all pages in parallel
        const results = await Promise.all(pngPages.map(async (page, index) => ({
            index,
            content: await getMarkDown({ groq, visionLLM, filePath: page.path })
        })));
        // Sort by index and merge
        const mergedContent = results
            .sort((a, b) => a.index - b.index)
            .map(r => r.content)
            .join('\n\n---\n\n');
        return mergedContent;
    }
    finally {
        // Cleanup temp directory
        if (fs_1.default.existsSync(tempDir)) {
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}
async function getMarkDown({ groq, visionLLM, filePath, }) {
    const systemPrompt = `You are a precise OCR system. Extract text from the image and format it as clean Markdown. Rules:

1. Format:
   - Use proper markdown headings (#, ##, ###)
   - Use bullet lists (- or *) for itemized content
   - Use numbered lists (1., 2., etc.) for sequential items
   - Use tables with | separator for tabular data
   - Preserve original text formatting (bold, italic) when clear
   
2. Content:
   - Extract ALL text visible in the image
   - Maintain the original text hierarchy
   - Keep all numbers and amounts exactly as shown
   - Include dates and times in their original format
   
3. Structure:
   - Start with the most prominent text as a heading
   - Group related items together
   - Use horizontal rules (---) to separate major sections
   
4. Output:
   - Return ONLY the markdown content
   - Do not explain, describe, or analyze the content
   - Do not include [END] or similar markers
   - Ensure the markdown is valid and well-formatted`;
    try {
        const finalImageUrl = isRemoteFile(filePath)
            ? filePath
            : `data:image/jpeg;base64,${encodeImage(filePath)}`;
        const output = await groq.chat.completions.create({
            model: visionLLM,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: finalImageUrl,
                            },
                        },
                    ],
                },
            ],
        });
        const content = output.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content received from API");
        }
        return content;
    }
    catch (error) {
        throw new Error(`Failed to process image: ${error.message}`);
    }
}
function encodeImage(imagePath) {
    try {
        const imageBuffer = fs_1.default.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    }
    catch (error) {
        throw new Error(`Failed to read image file: ${error.message}`);
    }
}
function isRemoteFile(filePath) {
    return filePath.startsWith("http://") || filePath.startsWith("https://");
}
/**
 * Multi-model OCR with confidence scoring
 */
async function ocrWithConfidence(options) {
    const { filePath, apiKey = process.env.GROQ_API_KEY, models = [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct", // Run same model twice for variability check
    ], } = options;
    if (!filePath) {
        throw new Error("filePath is required");
    }
    const groq = new groq_sdk_1.default({ apiKey, dangerouslyAllowBrowser: true });
    // Handle PDF files
    if (filePath.toLowerCase().endsWith(".pdf")) {
        return await processPDFWithConfidence(groq, filePath, models);
    }
    // Handle single image
    const imageUrl = isRemoteFile(filePath)
        ? filePath
        : `data:image/jpeg;base64,${encodeImage(filePath)}`;
    const result = await (0, ensemble_1.processPageWithConfidence)(groq, imageUrl, models);
    return {
        pageIndex: 0,
        imageUrl,
        ...result,
    };
}
async function processPDFWithConfidence(groq, filePath, models) {
    const tempDir = "./temp_pdf_pages";
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir, { recursive: true });
    }
    try {
        // Convert PDF to PNGs
        const pngPages = await (0, pdf_to_png_converter_1.pdfToPng)(filePath, {
            outputFolder: tempDir,
            verbosityLevel: 0,
        });
        // Process all pages in parallel with confidence scoring
        const results = await Promise.all(pngPages.map(async (page, index) => {
            const imageUrl = `data:image/png;base64,${fs_1.default
                .readFileSync(page.path)
                .toString("base64")}`;
            const result = await (0, ensemble_1.processPageWithConfidence)(groq, imageUrl, models);
            return {
                pageIndex: index,
                imageUrl, // Include the image URL for frontend display
                ...result,
            };
        }));
        return results;
    }
    finally {
        // Cleanup
        if (fs_1.default.existsSync(tempDir)) {
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}
