import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Force Edge runtime execution for ultra-low streaming latency
export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: `You are a helpful, witty AI agent. 
    You have access to custom tools. If a user asks about the price or value of a specific asset, ticker, or product, use the tool to check it before answering. Always explain what action you are taking.`,
    // Execute tool calling implicitly on the server frame
    maxSteps: 5, 
    tools: {
      getAssetPrice: tool({
        description: 'Get the current price or valuation of a specific asset ticker.',
        parameters: z.object({
          ticker: z.string().describe('The asset symbol, e.g. BTC, ETH, AAPL'),
        }),
        execute: async ({ ticker }) => {
          // Mock internal business logic database / API call
          const mockPrices: Record<string, string> = {
            BTC: '$94,500.00',
            ETH: '$3,420.50',
            AAPL: '$242.15',
          };
          const baseTicker = ticker.toUpperCase();
          const price = mockPrices[baseTicker] || '$100.00 (fallback estimation)';
          return { ticker: baseTicker, price };
        },
      }),
    },
  });

  // Convert the streaming result execution graph to a standard Web Response
  return result.toDataStreamResponse();
}
