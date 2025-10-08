"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) {
            return server_1.NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        // Create uploads directory if it doesn't exist
        const uploadsDir = (0, path_1.join)(process.cwd(), "uploads");
        if (!(0, fs_1.existsSync)(uploadsDir)) {
            await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
        }
        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = (0, path_1.join)(uploadsDir, file.name);
        await (0, promises_1.writeFile)(filePath, buffer);
        // Create a base64 data URL for the uploaded file (for display)
        const imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
        // TODO: Call the OCR service - ocrWithConfidence from parent package
        // For PDFs, we need to mock multiple pages
        // For now, return mock data with the actual image for ALL pages
        // Detect if PDF and create multiple pages
        const isPDF = file.type === "application/pdf";
        const numPages = isPDF ? 3 : 1; // Mock 3 pages for PDFs
        const mockResults = Array.from({ length: numPages }, (_, pageIndex) => ({
            pageIndex,
            imageUrl, // Include the image URL (same for all mock pages)
            confidence: {
                overall: 0.89,
                fieldLevel: [
                    {
                        field: "invoice_number",
                        consensus: "INV-2024-12345",
                        agreementScore: 1.0,
                        modelVotes: [
                            "INV-2024-12345",
                            "INV-2024-12345",
                            "INV-2024-12345",
                        ],
                        needsReview: false,
                    },
                    {
                        field: "total_amount",
                        consensus: "$1,457.32",
                        agreementScore: 0.67,
                        modelVotes: ["$1,457.32", "$1,457.32", "$1457.32"],
                        needsReview: true,
                    },
                    {
                        field: "date",
                        consensus: "October 7, 2025",
                        agreementScore: 0.92,
                        modelVotes: [
                            "October 7, 2025",
                            "Oct 7, 2025",
                            "October 7, 2025",
                        ],
                        needsReview: false,
                    },
                ],
            },
            extractedData: {
                invoice_number: "INV-2024-12345",
                total_amount: "$1,457.32",
                date: "October 7, 2025",
                vendor: "Acme Corporation",
                items: [
                    { description: "Widget A", quantity: 10, price: "$50.00" },
                    { description: "Widget B", quantity: 5, price: "$145.46" },
                ],
            },
            modelResults: [
                {
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    content: JSON.stringify({
                        invoice_number: "INV-2024-12345",
                        total_amount: "$1,457.32",
                    }),
                    confidence: 0.95,
                },
                {
                    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
                    content: JSON.stringify({
                        invoice_number: "INV-2024-12345",
                        total_amount: "$1,457.32",
                    }),
                    confidence: 0.84,
                },
                {
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    content: JSON.stringify({
                        invoice_number: "INV-2024-12345",
                        total_amount: "$1457.32",
                    }),
                    confidence: 0.88,
                },
            ],
            needsReview: pageIndex === 0, // Only first page needs review in mock
            reviewFields: pageIndex === 0 ? ["total_amount"] : [],
        }));
        return server_1.NextResponse.json(mockResults);
    }
    catch (error) {
        console.error("Error processing file:", error);
        return server_1.NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }
}
