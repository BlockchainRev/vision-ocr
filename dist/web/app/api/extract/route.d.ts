import { NextRequest, NextResponse } from "next/server";
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    pageIndex: number;
    imageUrl: string;
    confidence: {
        overall: number;
        fieldLevel: {
            field: string;
            consensus: string;
            agreementScore: number;
            modelVotes: string[];
            needsReview: boolean;
        }[];
    };
    extractedData: {
        invoice_number: string;
        total_amount: string;
        date: string;
        vendor: string;
        items: {
            description: string;
            quantity: number;
            price: string;
        }[];
    };
    modelResults: {
        model: string;
        content: string;
        confidence: number;
    }[];
    needsReview: boolean;
    reviewFields: string[];
}[]>>;
