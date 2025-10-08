import Groq from "groq-sdk";
import { ConfidenceExtractionResult } from "./types";
/**
 * Run multiple models and aggregate results with confidence scoring
 */
export declare function multiModelExtraction(groq: Groq, imageUrl: string, models: string[]): Promise<ConfidenceExtractionResult>;
/**
 * Process a single page with multi-model confidence scoring
 */
export declare function processPageWithConfidence(groq: Groq, imageUrl: string, models: string[]): Promise<ConfidenceExtractionResult>;
