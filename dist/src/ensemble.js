"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiModelExtraction = multiModelExtraction;
exports.processPageWithConfidence = processPageWithConfidence;
const types_1 = require("./types");
const similarity_1 = require("./similarity");
/**
 * Extract structured JSON from image using a vision model
 */
async function extractWithModel(groq, model, imageUrl) {
    const systemPrompt = `You are a comprehensive document extraction system. Your task is to extract EVERY piece of information from this document into structured JSON.

CRITICAL RULES:
1. Extract EVERYTHING - every field, every value, every piece of text visible in the document
2. Return ONLY valid JSON - no markdown, no code blocks, no explanations
3. Use clear, descriptive field names (e.g., "invoice_number", "total_amount", "billing_address")
4. Preserve ALL formatting in values (include currency symbols, dates as-is, decimals exactly as shown)
5. For tables/lists, use arrays of objects
6. For nested sections, use nested objects
7. Include metadata like document type, dates, reference numbers
8. Extract sender/recipient information completely
9. Extract ALL line items, descriptions, quantities, prices
10. Include totals, subtotals, taxes, fees - everything with numerical values

Example structure (adapt to your document):
{
  "document_type": "Invoice",
  "document_number": "INV-12345",
  "date": "October 7, 2025",
  "sender": {
    "name": "Company Name",
    "address": "123 Main St",
    "phone": "555-1234"
  },
  "recipient": {...},
  "line_items": [
    {"description": "Item 1", "quantity": 2, "unit_price": "$50.00", "total": "$100.00"}
  ],
  "subtotal": "$100.00",
  "tax": "$8.00",
  "total": "$108.00",
  "payment_terms": "Net 30",
  "notes": "Any additional notes"
}

Extract COMPLETELY. Do not summarize or skip fields.`;
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
    }
    catch (error) {
        throw new Error(`Model ${model} failed: ${error.message}`);
    }
}
/**
 * Run multiple models and aggregate results with confidence scoring
 */
async function multiModelExtraction(groq, imageUrl, models) {
    // Run all models in parallel
    const modelResults = await Promise.all(models.map((model) => extractWithModel(groq, model, imageUrl)));
    // Parse JSON from each model
    const parsedExtractions = modelResults.map((result) => {
        try {
            return JSON.parse(result.content);
        }
        catch {
            return {};
        }
    });
    // Get all unique fields across all models
    const allFields = new Set();
    parsedExtractions.forEach((extraction) => {
        Object.keys(extraction).forEach((key) => allFields.add(key));
    });
    // Calculate field-level confidence
    const fieldConfidences = [];
    const consensusData = {};
    allFields.forEach((field) => {
        const values = parsedExtractions.map((ext) => ext[field] !== undefined ? ext[field] : "");
        const { consensus, agreementScore, votes } = (0, similarity_1.calculateFieldAgreement)(values);
        consensusData[field] = consensus;
        fieldConfidences.push({
            field,
            consensus: typeof consensus === 'object' ? JSON.stringify(consensus) : String(consensus),
            agreementScore,
            modelVotes: votes,
            needsReview: agreementScore < types_1.DEFAULT_THRESHOLDS.medium,
        });
    });
    // Calculate overall confidence
    const overallConfidence = fieldConfidences.length > 0
        ? fieldConfidences.reduce((sum, fc) => sum + fc.agreementScore, 0) /
            fieldConfidences.length
        : 0;
    // Determine which fields need review
    const reviewFields = fieldConfidences
        .filter((fc) => fc.needsReview)
        .map((fc) => fc.field);
    const needsReview = overallConfidence < types_1.DEFAULT_THRESHOLDS.high;
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
async function processPageWithConfidence(groq, imageUrl, models) {
    return multiModelExtraction(groq, imageUrl, models);
}
