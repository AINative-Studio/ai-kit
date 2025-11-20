/**
 * Research API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchAgent } from '@/agents/research-agent';
import type { ResearchQuery } from '@/agents/research-agent';
import { z } from 'zod';

const ResearchQuerySchema = z.object({
  topic: z.string().min(3),
  depth: z.enum(['basic', 'intermediate', 'comprehensive']).default('intermediate'),
  sources: z.number().min(1).max(20).optional(),
  includeImages: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = ResearchQuerySchema.parse(body) as ResearchQuery;

    const result = await researchAgent.research(query);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Research failed',
          message: result.error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.output,
      metrics: {
        tokensUsed: result.totalTokens,
        costUsd: result.totalCost,
        durationMs: result.durationMs,
        steps: result.steps.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
