/**
 * GET /api/food/search
 * Search the food database (USDA FoodData Central).
 *
 * Query params:
 *   q       - search query (required)
 *   page    - page number (default: 1)
 *   limit   - results per page (default: 20, max: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFoods, stripRawDataFromResults } from '@/lib/foodDatabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get('q')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: q' },
      { status: 400 }
    );
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: 'Query too long (max 200 characters)' },
      { status: 400 }
    );
  }

  try {
    const results = await searchFoods(query, {
      pageSize: limit,
      pageNumber: page,
    });

    return NextResponse.json(stripRawDataFromResults(results), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[/api/food/search] Error:', error);

    const message = error instanceof Error ? error.message : 'Search failed';

    // Surface configuration errors clearly
    if (message.includes('not configured')) {
      return NextResponse.json(
        { error: message, hint: 'Add API keys to .env.local' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Food search failed', details: message },
      { status: 500 }
    );
  }
}
