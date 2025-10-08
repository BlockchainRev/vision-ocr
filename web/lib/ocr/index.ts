import { config } from "dotenv";
config();

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { processPageWithConfidence } from "./ensemble";
import { ConfidenceExtractionResult, MultiModelOCROptions } from "./types";

const execAsync = promisify(exec);

export async function ocrWithConfidence(
  options: MultiModelOCROptions
): Promise<ConfidenceExtractionResult | ConfidenceExtractionResult[]> {
  const {
    filePath,
    apiKey = process.env.GROQ_API_KEY,
    models = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
  } = options;

  if (!filePath) {
    throw new Error("filePath is required");
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  // Handle PDF files
  if (filePath.toLowerCase().endsWith(".pdf")) {
    const tempDir = path.join(path.dirname(filePath), "pdf_pages");

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Convert PDF to PNG images using system poppler with reduced DPI for smaller file sizes
      const outputPrefix = path.join(tempDir, path.basename(filePath, ".pdf"));
      await execAsync(`pdftocairo -png -r 100 "${filePath}" "${outputPrefix}"`);

      // Find all generated PNG files
      const files = fs.readdirSync(tempDir)
        .filter(f => f.endsWith('.png'))
        .sort();

      // Process ALL pages in batches of 10
      const BATCH_SIZE = 10;
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const imagePath = path.join(tempDir, files[i]);
        const imageBuffer = fs.readFileSync(imagePath);
        const imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        const result = await processPageWithConfidence(groq, imageUrl, models);
        results.push({
          pageIndex: i,
          totalPages: files.length,
          imageUrl,
          ...result,
        });

        // Log progress every BATCH_SIZE pages
        if ((i + 1) % BATCH_SIZE === 0) {
          console.log(`Processed ${i + 1}/${files.length} pages`);
        }
      }

      return results;
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  // Handle single image
  const imageBuffer = fs.readFileSync(filePath);
  const imageUrl = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  const result = await processPageWithConfidence(groq, imageUrl, models);

  return {
    pageIndex: 0,
    imageUrl,
    ...result,
  };
}
