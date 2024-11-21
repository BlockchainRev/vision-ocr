import { config } from "dotenv";
config();

import Groq from "groq-sdk";
import fs from "fs";

export async function ocr({
  filePath,
  apiKey = process.env.GROQ_API_KEY,
  model = "llama-3.2-11b-vision-preview",
}: {
  filePath: string;
  apiKey?: string;
  model?: "llama-3.2-11b-vision-preview" | "llama-3.2-90b-vision-preview";
}) {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });
  let finalMarkdown = await getMarkDown({ groq, visionLLM: model, filePath });
  
  // Validate output
  if (!finalMarkdown || finalMarkdown.trim().length === 0) {
    throw new Error("No content was extracted from the image");
  }

  return finalMarkdown;
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
