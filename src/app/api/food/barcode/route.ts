/**
 * GET /api/food/barcode
 * Look up a food product by barcode (UPC/EAN)
 *
 * Query params:
 *   code - barcode (required, 8-14 digits)
 *
 * Fallback chain: OpenFoodFacts -> USDA Branded
 */

import { NextRequest, NextResponse } from 'next/server';
import { lookupBarcode, stripRawDataFromBarcode } from '@/lib/foodDatabase';
import { searchUSDAByBarcode } from '@/lib/foodDatabase/usda';

export const runtime = 'nodejs';

// UPC-A (12), EAN-13 (13), EAN-8 (8), UPC-E (8), GTIN-14 (14)
const BARCODE_REGEX = /^\d{8,14}$/;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code')?.trim();

  if (!code) {
    return NextResponse.json(
      { error: 'Missing required parameter: code' },
      { status: 400 }
    );
  }

  if (!BARCODE_REGEX.test(code)) {
    return NextResponse.json(
      { error: 'Invalid barcode format. Expected 8-14 digits.' },
      { status: 400 }
    );
  }

  try {
    // Primary: OpenFoodFacts
    let result = await lookupBarcode(code);

    // Fallback: USDA branded foods
    if (!result.success) {
      const usdaResult = await searchUSDAByBarcode(code);
      if (usdaResult) {
        result = { success: true, result: usdaResult, source: 'usda' };
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Product not found', code },
        { status: 404 }
      );
    }

    return NextResponse.json(stripRawDataFromBarcode(result), {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[/api/food/barcode] Error:', error);

    const message = error instanceof Error ? error.message : 'Barcode lookup failed';

    if (message.includes('not configured')) {
      return NextResponse.json(
        { error: message, hint: 'Add API keys to .env.local' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Barcode lookup failed', details: message },
      { status: 500 }
    );
  }
}
