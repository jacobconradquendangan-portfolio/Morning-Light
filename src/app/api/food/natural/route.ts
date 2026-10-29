/**
 * POST /api/food/natural
 * Parse a natural language food description into structured entries
 * e.g., "2 eggs and a cup of rice" -> [Egg (2 large), Rice (1 cup)]
 *
 * Body:
 *   { query: string }
 *
 * Powered by the CalorieNinjas nutrition endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery, stripRawData, isCalorieNinjasConfigured } from '@/lib/foodDatabase';

export const runtime = 'nodejs';

/**
 * GET /api/food/natural
 * Reports whether natural-language parsing is available, so the UI can hide
 * the feature instead of offering a button that always fails.
 */
export async function GET() {
  return NextResponse.json({ available: isCalorieNinjasConfigured() });
}

const MAX_QUERY_LENGTH = 500;

export async function POST(request: NextRequest) {
  let body: { query?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required field: query' },
      { status: 400 }
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` },
      { status: 400 }
    );
  }

  try {
    const result = await parseNaturalLanguageQuery(query);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Could not parse food description' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { ...result, foods: result.foods?.map(stripRawData) },
      {
        headers: {
          // Natural language results are user-specific; don't cache at CDN
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[/api/food/natural] Error:', error);

    const message = error instanceof Error ? error.message : 'Natural language parse failed';

    if (message.includes('not configured')) {
      return NextResponse.json(
        { error: message, hint: 'Add CALORIENINJAS_API_KEY to .env.local' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Natural language parse failed', details: message },
      { status: 500 }
    );
  }
}
