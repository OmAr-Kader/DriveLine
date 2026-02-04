import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { LoggerKit } from 'src/common/utils/LogKit';
import { GeminiRequest, GeminiResponse } from 'src/common/dto/gemini.dto';

@Injectable()
export class GeminiService {
  private readonly logger = LoggerKit.create(GeminiService.name);

  constructor(private readonly httpService: HttpService) {}

  async generateContent(prompt: string): Promise<string> {
    this.logger?.log('Generating content for prompt:', prompt);
    const formattedPrompt = `Default behavior: Answer the question in clear, step-by-step instructions. 
            Exception: If the user specifically requests a "one-sentence answer", return exactly one sentence. 
            Do NOT expand it into steps or multiple sentences under any circumstances.
            If relevant, provide links to explanations or YouTube videos. Question: "${prompt}"`.trim();

    if (!formattedPrompt) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Prompt cannot be empty.' });
    }
    this.logger?.log('---- HTTP service', prompt);
    this.logger?.log('---- HTTP service', process.env.GEMINI_MODEL);

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
        throw new RpcException({ code: status.INTERNAL, message: 'No content returned.' });
      }
      this.logger?.log('---- HTTP service', text);
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
        throw new RpcException({ code: status.INTERNAL, message: axiosErr.response?.data?.error?.message || 'Unknown API error' });
      } else if (err instanceof Error) {
        throw new RpcException({ code: status.UNAVAILABLE, message: err.message });
      } else {
        throw new RpcException({ code: status.UNKNOWN, message: 'Unknown error' });
      }
    }
  }
}
