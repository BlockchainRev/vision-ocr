export declare function ocr({ filePath, apiKey, model, }: {
    filePath: string;
    apiKey?: string;
    model?: "llama-3.2-11b-vision-preview" | "llama-3.2-90b-vision-preview";
}): Promise<string>;
