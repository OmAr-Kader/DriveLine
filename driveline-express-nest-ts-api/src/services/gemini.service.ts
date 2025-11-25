import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { GeminiError, GeminiRequest, GeminiResponse } from '../dto/create.gemini.dto';

@Injectable()
export class GeminiService {
  constructor(private readonly httpService: HttpService) {}

  async generateContent(prompt: string): Promise<string> {
    const formattedPrompt = `Default behavior: Answer the question in clear, step-by-step instructions. 
      Exception: If the user specifically requests a "one-sentence answer", return exactly one sentence. 
      Do NOT expand it into steps or multiple sentences under any circumstances.
      If relevant, provide links to explanations or YouTube videos. Question: "${prompt}"`.trim();

    if (!formattedPrompt) {
      throw new GeminiError('InvalidPrompt', undefined, 'Prompt cannot be empty.');
    }

    const GEMINI_URL = process.env.GEMINI_URL!;
    const GEMINI_MODEL = process.env.GEMINI_MODEL!;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

    const url = `${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload: GeminiRequest = {
      contents: [
        {
          parts: [{ text: formattedPrompt }],
        },
      ],
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post<GeminiResponse>(url, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const text = response.data.candidates?.[0]?.content.parts?.[0]?.text?.trim();
      if (!text) {
        throw new GeminiError('NoContent', undefined, 'No content returned.');
      }
      return text;
    } catch (err: unknown) {
      // Instead of err: any, use err: unknown. Then use type guards:
      if (typeof err === 'object' && err !== null && 'response' in err) {
        // Could use AxiosError type if desired
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { error?: { message?: string } };
          };
        };
        throw new GeminiError('ApiError', axiosErr.response?.status, axiosErr.response?.data?.error?.message || 'Unknown API error');
      } else if (err instanceof Error) {
        throw new GeminiError('NetworkError', undefined, err.message);
      } else {
        throw new GeminiError('NetworkError', undefined, 'Unknown error');
      }
    }
  }
}
