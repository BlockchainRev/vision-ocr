"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSimilarity = calculateSimilarity;
exports.calculateFieldAgreement = calculateFieldAgreement;
exports.compareExtractions = compareExtractions;
const fastest_levenshtein_1 = require("fastest-levenshtein");
/**
 * Normalize string for comparison (removes formatting differences)
 * - Removes whitespace, commas, currency symbols, periods in numbers
 * - Converts to lowercase
 */
function normalizeForComparison(str) {
    return str
        .toLowerCase()
        .replace(/[\s,\$€£¥₹]/g, "") // Remove spaces, commas, currency symbols
        .replace(/\.(?=\d)/g, ""); // Remove periods only between digits (keep in decimals at end)
}
/**
 * Calculate normalized similarity between two strings (0-1 scale)
 * 1 = identical, 0 = completely different
 * Normalizes numbers and currency before comparison
 */
function calculateSimilarity(str1, str2) {
    if (str1 === str2)
        return 1;
    if (!str1 || !str2)
        return 0;
    // Normalize both strings (removes formatting differences)
    const normalized1 = normalizeForComparison(str1);
    const normalized2 = normalizeForComparison(str2);
    if (normalized1 === normalized2)
        return 1;
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0)
        return 1;
    const levenshteinDistance = (0, fastest_levenshtein_1.distance)(normalized1, normalized2);
    return 1 - levenshteinDistance / maxLength;
}
/**
 * Normalize value to string for comparison (handles objects, arrays, etc)
 */
function normalizeValue(value) {
    if (value === null || value === undefined)
        return "";
    if (typeof value === "object") {
        return JSON.stringify(value, null, 0);
    }
    return String(value);
}
/**
 * Calculate field-level agreement across multiple model outputs
 */
function calculateFieldAgreement(values) {
    if (values.length === 0) {
        return { consensus: "", agreementScore: 0, votes: [] };
    }
    if (values.length === 1) {
        return { consensus: values[0], agreementScore: 1, votes: [normalizeValue(values[0])] };
    }
    // Normalize all values for comparison
    const normalizedValues = values.map(normalizeValue);
    // Find the most common value (majority voting)
    const valueCounts = new Map();
    normalizedValues.forEach((val) => {
        valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
    });
    let consensus = values[0];
    let maxCount = 0;
    valueCounts.forEach((count, value) => {
        if (count > maxCount) {
            maxCount = count;
            // Find original value that matches this normalized string
            const idx = normalizedValues.indexOf(value);
            consensus = values[idx];
        }
    });
    // If no clear majority, use similarity-based consensus
    if (maxCount === 1) {
        // Calculate average similarity between all pairs
        let totalSimilarity = 0;
        let comparisons = 0;
        for (let i = 0; i < normalizedValues.length; i++) {
            for (let j = i + 1; j < normalizedValues.length; j++) {
                totalSimilarity += calculateSimilarity(normalizedValues[i], normalizedValues[j]);
                comparisons++;
            }
        }
        const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
        return { consensus, agreementScore: avgSimilarity, votes: normalizedValues };
    }
    // Agreement score = percentage of models agreeing on consensus
    const agreementScore = maxCount / values.length;
    return { consensus, agreementScore, votes: normalizedValues };
}
/**
 * Compare two JSON objects field by field and return agreement metrics
 */
function compareExtractions(extraction1, extraction2) {
    const allKeys = new Set([
        ...Object.keys(extraction1),
        ...Object.keys(extraction2),
    ]);
    if (allKeys.size === 0)
        return 1;
    let totalSimilarity = 0;
    allKeys.forEach((key) => {
        const val1 = String(extraction1[key] ?? "");
        const val2 = String(extraction2[key] ?? "");
        totalSimilarity += calculateSimilarity(val1, val2);
    });
    return totalSimilarity / allKeys.size;
}
