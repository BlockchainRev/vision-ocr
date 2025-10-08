import { config } from "dotenv";
config();

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { pdfToPng } from "pdf-to-png-converter";
import { processPageWithConfidence } from "./ensemble";
import { ConfidenceExtractionResult, MultiModelOCROptions } from "./types";

export async function ocr({
  filePath,
  apiKey = process.env.GROQ_API_KEY,
  model = "meta-llama/llama-4-scout-17b-16e-instruct",
}: {
  filePath: string;
  apiKey?: string;
  model?: string;
}) {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });

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

async function processPDF({
  groq,
  visionLLM,
  filePath,
}: {
  groq: Groq;
  visionLLM: string;
  filePath: string;
}) {
  const tempDir = './temp_pdf_pages';

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Convert PDF to PNG images
    const pngPages = await pdfToPng(filePath, {
      outputFolder: tempDir,
      verbosityLevel: 0
    });

    // Process all pages in parallel
    const results = await Promise.all(
      pngPages.map(async (page, index) => ({
        index,
        content: await getMarkDown({ groq, visionLLM, filePath: page.path })
      }))
    );

    // Sort by index and merge
    const mergedContent = results
      .sort((a, b) => a.index - b.index)
      .map(r => r.content)
      .join('\n\n---\n\n');

    return mergedContent;
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

async function getMarkDown({
  groq,
  visionLLM,
  filePath,
}: {
  groq: Groq;
  visionLLM: string;
  filePath: string;
}) {
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
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

function encodeImage(imagePath: string) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }
}

function isRemoteFile(filePath: string): boolean {
  return filePath.startsWith("http://") || filePath.startsWith("https://");
}

/**
 * Multi-model OCR with confidence scoring
 */
export async function ocrWithConfidence(
  options: MultiModelOCROptions
): Promise<ConfidenceExtractionResult | ConfidenceExtractionResult[]> {
  const {
    filePath,
    apiKey = process.env.GROQ_API_KEY,
    models = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "meta-llama/llama-4-scout-17b-16e-instruct", // Run same model twice for variability check
    ],
  } = options;

  if (!filePath) {
    throw new Error("filePath is required");
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  // Handle PDF files
  if (filePath.toLowerCase().endsWith(".pdf")) {
    return await processPDFWithConfidence(groq, filePath, models);
  }

  // Handle single image
  const imageUrl = isRemoteFile(filePath)
    ? filePath
    : `data:image/jpeg;base64,${encodeImage(filePath)}`;

  const result = await processPageWithConfidence(groq, imageUrl, models);

  return {
    pageIndex: 0,
    imageUrl,
    ...result,
  };
}

async function processPDFWithConfidence(
  groq: Groq,
  filePath: string,
  models: string[]
): Promise<ConfidenceExtractionResult[]> {
  const tempDir = "./temp_pdf_pages";

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Convert PDF to PNGs
    const pngPages = await pdfToPng(filePath, {
      outputFolder: tempDir,
      verbosityLevel: 0,
    });

    // Process all pages in parallel with confidence scoring
    const results = await Promise.all(
      pngPages.map(async (page, index) => {
        const imageUrl = `data:image/png;base64,${fs
          .readFileSync(page.path)
          .toString("base64")}`;

        const result = await processPageWithConfidence(groq, imageUrl, models);
        return {
          pageIndex: index,
          imageUrl, // Include the image URL for frontend display
          ...result,
        };
      })
    );

    return results;
  } finally {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
