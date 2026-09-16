import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SYLLABUS_FILE = path.join(DATA_DIR, 'syllabuses.json');

function readSyllabuses() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SYLLABUS_FILE)) {
      fs.writeFileSync(SYLLABUS_FILE, JSON.stringify({}), 'utf-8');
      return {};
    }
    const content = fs.readFileSync(SYLLABUS_FILE, 'utf-8');
    return JSON.parse(content) || {};
  } catch (e) {
    return {};
  }
}

function writeSyllabuses(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SYLLABUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

import pool from '@/lib/db';

const memorySyllabusCache = new Map();
const SYLLABUS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function extractYoutubeId(youtube, content) {
  if (youtube) {
    const match = youtube.match(/(?:v=|\/embed\/|\.be\/|^)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    return youtube.split('&')[0];
  }
  if (content) {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        for (const block of parsed.blocks) {
          if (block.type === 'embed' && block.data) {
            if (block.data.embed) return block.data.embed;
            if (block.data.source) {
              const match = block.data.source.match(/(?:v=|\/embed\/|\.be\/|^)([a-zA-Z0-9_-]{11})/);
              if (match) return match[1];
            }
          }
        }
      }
    } catch (_) {}
  }
  return '';
}

// GET /api/courses/[id]/syllabus
export async function GET(req, { params }) {
  const { id } = params;

  const cached = memorySyllabusCache.get(id);
  if (cached && (Date.now() - cached.timestamp < SYLLABUS_CACHE_TTL_MS)) {
    return NextResponse.json(cached.data);
  }

  try {
    // 1. Fetch chapters from TiDB
    const [chapters] = await pool.query(
      'SELECT name, title, course, idx FROM test.`tabCourse Chapter` WHERE course = ? ORDER BY idx, creation ASC',
      [id]
    );

    // 2. Fetch lessons from TiDB
    const [lessons] = await pool.query(
      'SELECT name, title, chapter, course, content, body, youtube, idx FROM test.`tabCourse Lesson` WHERE course = ? ORDER BY idx, creation ASC',
      [id]
    );

    if (chapters && chapters.length > 0) {
      const lessonMap = {};
      (lessons || []).forEach(l => {
        if (!lessonMap[l.chapter]) lessonMap[l.chapter] = [];
        lessonMap[l.chapter].push({
          id: l.name,
          title: l.title,
          youtube: extractYoutubeId(l.youtube, l.content) || 'QhA4h6qD4wY',
          duration: '15 mins',
          overview: l.body || l.title,
          bulletPoints: [
            `Core concept: ${l.title}`,
            'Interactive exercise and code review',
            'Summary review and checkpoint quiz'
          ]
        });
      });

      const modules = chapters.map(ch => ({
        id: ch.name,
        title: ch.title,
        lessons: lessonMap[ch.name] || []
      }));

      const syllabusData = { ok: true, modules };

      // Cache locally
      const all = readSyllabuses();
      all[id] = syllabusData;
      writeSyllabuses(all);
      memorySyllabusCache.set(id, { data: syllabusData, timestamp: Date.now() });

      return NextResponse.json(syllabusData);
    }
  } catch (err) {
    console.warn(`[API/Syllabus] Database query notice for course ${id}:`, err.message);
  }

  const all = readSyllabuses();
  const found = all[id];

  if (found) {
    memorySyllabusCache.set(id, { data: found, timestamp: Date.now() });
    return NextResponse.json(found);
  }

  return NextResponse.json({ ok: true, modules: [] });
}

// POST /api/courses/[id]/syllabus
export async function POST(req, { params }) {
  try {
    const { id } = params;
    memorySyllabusCache.delete(id);
    const body = await req.json();
    const all = readSyllabuses();
    const syllabus = body.syllabus || body;

    all[id] = syllabus;
    writeSyllabuses(all);

    return NextResponse.json({ success: true, syllabus });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
