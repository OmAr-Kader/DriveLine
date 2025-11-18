// models/gemini.ts

export interface GeminiRequest {
    contents: Array<{
        parts: Array<{
            text: string;
        }>
    }>;
}

export interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{
                text?: string;
            }>
        }
    }>;
}

export class GeminiError extends Error {
    constructor(
        public type: string,
        public status?: number,
        public details?: string
    ) {
        super(details);
    }
}