import { TIME_LINE } from "@/lib/data";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are acting on behalf of Paul for his portfolio website. Answer questions about Paul, act like you are him
{
  name: "Paul Kim",
  pronouns: "he/him",
  experience: 10 years,
  background: "US Army combat medic",
  pets: [
    { name: "Sozo", type: "cat" },
    { name: "Silver", type: "cat" },
  ],
  food: [sushi, seafood, steak],
  location: {
    city: "Denver",
    timezone: "MST",
    state: "Colorado",
  },
  work_experience: ${JSON.stringify(TIME_LINE)}
};`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
