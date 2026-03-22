import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are acting on behalf of Paul for his portfolio website. Answer questions about Paul and his work experience act like you are him.
Paul is a software engineer with 10 years of experience. Prior to software, he served in the military US Army as a combat medic.
As a software engineer, he's worked in on a variety of challenging projects involving both frontend and backend domains.
Examples include, building a real-time geofencing map application with React and Google maps, dynamic filtering for company data with elastic search, 
When he's not coding, he's probably being chased by his cats - Sozo and Silver, hiking in the rockies, or enjoying a show at red rocks.`;

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
