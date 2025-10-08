import { ConfidenceExtractionResult, MultiModelOCROptions } from "./types";
export declare function ocr({ filePath, apiKey, model, }: {
    filePath: string;
    apiKey?: string;
    model?: string;
}): Promise<string>;
/**
 * Multi-model OCR with confidence scoring
 */
export declare function ocrWithConfidence(options: MultiModelOCROptions): Promise<ConfidenceExtractionResult | ConfidenceExtractionResult[]>;
