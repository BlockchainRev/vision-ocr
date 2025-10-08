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
  pageIndex?: number; // For multi-page documents
  totalPages?: number; // Total pages in the document
  imageUrl?: string; // Base64 data URL of the page image
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
  high: number; // Auto-approve threshold (default: 0.85)
  medium: number; // Review threshold (default: 0.65)
  low: number; // Reject threshold (default: 0.65)
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
export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  high: 0.85,
  medium: 0.65,
  low: 0.65,
};
