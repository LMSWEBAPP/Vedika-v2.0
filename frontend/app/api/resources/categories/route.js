import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

let categoriesCache = null;
let lastCategoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  const now = Date.now();
  if (categoriesCache && (now - lastCategoriesCacheTime < CATEGORIES_CACHE_TTL_MS)) {
    return NextResponse.json(categoriesCache);
  }

  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category, subcategory FROM pdf_categories ORDER BY category, subcategory'
    );
    categoriesCache = rows;
    lastCategoriesCacheTime = now;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
