/**
 * Model extraction result with optional confidence
 */
export interface ModelExtraction {
    model: string;
    content: string;
    confidence?: number;
}
/**
 * Field-level confidence information
 */
export interface FieldConfidence {
    field: string;
    consensus: string;
    agreementScore: number;
    modelVotes: string[];
    needsReview: boolean;
}
/**
 * Complete extraction result with confidence scoring
 */
export interface ConfidenceExtractionResult {
    pageIndex?: number;
    imageUrl?: string;
    extractedData: Record<string, any>;
    confidence: {
        overall: number;
        fieldLevel: FieldConfidence[];
    };
    modelResults: ModelExtraction[];
    needsReview: boolean;
    reviewFields: string[];
}
/**
 * Confidence thresholds for decision making
 */
export interface ConfidenceThresholds {
    high: number;
    medium: number;
    low: number;
}
/**
 * Multi-model OCR options
 */
export interface MultiModelOCROptions {
    filePath: string;
    apiKey?: string;
    models?: string[];
    thresholds?: ConfidenceThresholds;
    returnFormat?: "json" | "markdown";
}
/**
 * Default confidence thresholds
 */
export declare const DEFAULT_THRESHOLDS: ConfidenceThresholds;
