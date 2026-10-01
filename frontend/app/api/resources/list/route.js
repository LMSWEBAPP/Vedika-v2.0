import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const listQueryCache = new Map();
const LIST_CACHE_TTL_MS = 20 * 1000; // 20s cache per unique query

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10);
    const format = searchParams.get('format') || 'array';

    const cacheKey = `${search}|${category}|${subcategory}|${sortBy}|${page}|${limit}|${format}`;
    const cached = listQueryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < LIST_CACHE_TTL_MS)) {
      return NextResponse.json(cached.data);
    }

    let sql = 'SELECT * FROM pdf_library_view WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (subcategory && subcategory !== 'all') {
      sql += ' AND subcategory = ?';
      params.push(subcategory);
    }

    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    // Apply sorting
    if (sortBy === 'title') {
      sql += ' ORDER BY name ASC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    if (limit > 0) {
      const safeLimit = Math.min(Math.max(1, limit), 200);
      const safeOffset = Math.max(0, (page > 0 ? page - 1 : 0) * safeLimit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(safeLimit, safeOffset);
    }

    const [rows] = await pool.query(sql, params);

    const resultData = format === 'paginated' 
      ? { data: rows, page: Math.max(1, page), limit: limit > 0 ? limit : rows.length }
      : rows;

    listQueryCache.set(cacheKey, { data: resultData, timestamp: Date.now() });

    // Evict old cache keys if cache grows large
    if (listQueryCache.size > 200) {
      const oldestKey = listQueryCache.keys().next().value;
      listQueryCache.delete(oldestKey);
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Error fetching resources list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
