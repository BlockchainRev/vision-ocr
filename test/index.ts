import { ocr } from "../src/index";
import fs from "fs";
import path from "path";

async function main() {
  const inputPath = "/Users/samaylakhani/vision-ocr/test/106587.pdf";

  let markdown = await ocr({
    filePath: inputPath,
    apiKey: process.env.GROQ_API_KEY,
  });

  // Generate unique output filename based on input file and timestamp
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const outputPath = path.join(process.cwd(), 'output', `${inputName}_${timestamp}.md`);

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(outputPath, markdown);

  console.log(`✓ Saved to: ${outputPath}`);
}

main();
