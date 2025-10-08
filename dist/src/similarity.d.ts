/**
 * Calculate normalized similarity between two strings (0-1 scale)
 * 1 = identical, 0 = completely different
 * Normalizes numbers and currency before comparison
 */
export declare function calculateSimilarity(str1: string, str2: string): number;
/**
 * Calculate field-level agreement across multiple model outputs
 */
export declare function calculateFieldAgreement(values: any[]): {
    consensus: any;
    agreementScore: number;
    votes: string[];
};
/**
 * Compare two JSON objects field by field and return agreement metrics
 */
export declare function compareExtractions(extraction1: Record<string, any>, extraction2: Record<string, any>): number;
