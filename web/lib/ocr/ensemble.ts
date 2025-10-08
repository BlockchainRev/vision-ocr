import Groq from "groq-sdk";
import {
  ModelExtraction,
  ConfidenceExtractionResult,
  MultiModelOCROptions,
  DEFAULT_THRESHOLDS,
  FieldConfidence,
} from "./types";
import { calculateFieldAgreement, compareExtractions } from "./similarity";

/**
 * Extract structured JSON from image using a vision model
 */
async function extractWithModel(
  groq: Groq,
  model: string,
  imageUrl: string
): Promise<ModelExtraction> {
  const systemPrompt = `You are a comprehensive document extraction system. Extract ALL information from this document into STANDARDIZED JSON.

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Use this EXACT top-level structure:
{
  "metadata": {
    "document_type": "type here",
    "document_id": "ID/number here",
    "date": "date here",
    "page_number": "if visible"
  },
  "parties": {
    "sender": {"name": "", "address": "", "contact": ""},
    "recipient": {"name": "", "address": "", "contact": ""}
  },
  "line_items": [
    {"item": "", "description": "", "quantity": "", "unit_price": "", "amount": ""}
  ],
  "amounts": {
    "subtotal": "",
    "tax": "",
    "fees": "",
    "total": ""
  },
  "additional_fields": {
    "field_name": "field_value"
  }
}

3. Preserve EXACT numerical formatting (include $, commas, decimals as shown: $1,234.56)
4. Use consistent field names across ALL extractions
5. If a field doesn't exist, use empty string "" - DO NOT omit fields
6. For line_items, use the EXACT structure shown above for every item
7. Put any extra fields in "additional_fields" object
8. Numbers must match EXACTLY what's visible (don't normalize)

Extract EVERYTHING visible in the document following this structure PRECISELY.`;

  try {
    const output = await groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = output.choices[0]?.message?.content || "{}";

    // Extract JSON from potential markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
    }

    return {
      model,
      content: jsonContent,
      confidence: 1.0, // Groq doesn't provide confidence scores yet
    };
  } catch (error: any) {
    throw new Error(`Model ${model} failed: ${error.message}`);
  }
}

/**
 * Run multiple models and aggregate results with confidence scoring
 */
export async function multiModelExtraction(
  groq: Groq,
  imageUrl: string,
  models: string[]
): Promise<ConfidenceExtractionResult> {
  // Run all models in parallel
  const modelResults = await Promise.all(
    models.map((model) => extractWithModel(groq, model, imageUrl))
  );

  // Parse JSON from each model
  const parsedExtractions = modelResults.map((result) => {
    try {
      return JSON.parse(result.content);
    } catch {
      return {};
    }
  });

  // Get all unique fields across all models
  const allFields = new Set<string>();
  parsedExtractions.forEach((extraction) => {
    Object.keys(extraction).forEach((key) => allFields.add(key));
  });

  // Calculate field-level confidence
  const fieldConfidences: FieldConfidence[] = [];
  const consensusData: Record<string, any> = {};

  allFields.forEach((field) => {
    const values = parsedExtractions.map((ext) => ext[field] !== undefined ? ext[field] : "");
    const { consensus, agreementScore, votes } = calculateFieldAgreement(values);

    consensusData[field] = consensus;

    fieldConfidences.push({
      field,
      consensus: typeof consensus === 'object' ? JSON.stringify(consensus) : String(consensus),
      agreementScore,
      modelVotes: votes,
      needsReview: agreementScore < DEFAULT_THRESHOLDS.medium,
    });
  });

  // Calculate overall confidence
  const overallConfidence =
    fieldConfidences.length > 0
      ? fieldConfidences.reduce((sum, fc) => sum + fc.agreementScore, 0) /
        fieldConfidences.length
      : 0;

  // Determine which fields need review
  const reviewFields = fieldConfidences
    .filter((fc) => fc.needsReview)
    .map((fc) => fc.field);

  const needsReview = overallConfidence < DEFAULT_THRESHOLDS.high;

  return {
    extractedData: consensusData,
    confidence: {
      overall: overallConfidence,
      fieldLevel: fieldConfidences,
    },
    modelResults,
    needsReview,
    reviewFields,
  };
}

/**
 * Process a single page with multi-model confidence scoring
 */
export async function processPageWithConfidence(
  groq: Groq,
  imageUrl: string,
  models: string[]
): Promise<ConfidenceExtractionResult> {
  return multiModelExtraction(groq, imageUrl, models);
}
