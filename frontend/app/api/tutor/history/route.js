import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Ensure table exists on first request
let tableInitialized = false;

async function ensureTable() {
  if (tableInitialized) return;
  const createSql = `
    CREATE TABLE IF NOT EXISTS tab_tutor_sessions (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      user_id VARCHAR(128) NOT NULL,
      type VARCHAR(32) NOT NULL DEFAULT 'general',
      label VARCHAR(255) NOT NULL DEFAULT 'Untitled Chat',
      mode VARCHAR(32) NOT NULL DEFAULT 'Beginner',
      length VARCHAR(32) NOT NULL DEFAULT 'Short',
      messages MEDIUMTEXT NOT NULL,
      documents TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_type_updated (user_id, type, updated_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  try {
    await pool.query(createSql);
    tableInitialized = true;
    console.warn('[TutorHistory API] tab_tutor_sessions table verified.');
  } catch (err) {
    console.error('[TutorHistory API] Failed to verify tab_tutor_sessions table:', err.message);
  }
}

// GET /api/tutor/history?userId=...&type=general
export async function GET(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'general';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT id, user_id, type, label, mode, length, messages, documents, created_at, updated_at
       FROM tab_tutor_sessions
       WHERE user_id = ? AND type = ?
       ORDER BY updated_at DESC
       LIMIT 100`,
      [userId, type]
    );

    const sessions = (rows || []).map(row => {
      let parsedMessages = [];
      let parsedDocs = [];
      try {
        parsedMessages = JSON.parse(row.messages || '[]');
      } catch (e) {
        parsedMessages = [];
      }
      try {
        parsedDocs = JSON.parse(row.documents || '[]');
      } catch (e) {
        parsedDocs = [];
      }

      return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        label: row.label,
        topic: row.label,
        mode: row.mode,
        length: row.length,
        messages: parsedMessages,
        documents: parsedDocs,
        timestamp: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[TutorHistory GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch tutor history', details: err.message }, { status: 500 });
  }
}

// POST /api/tutor/history
// Body: { id, userId, type, label, mode, length, messages, documents }
export async function POST(request) {
  try {
    await ensureTable();
    const body = await request.json();
    const sessionData = body.session || body;
    const userId = body.userId || sessionData.userId;
    const id = sessionData.id || body.id;
    const type = sessionData.type || body.type || 'general';
    const label = sessionData.label || sessionData.topic || body.label;
    const mode = sessionData.mode || body.mode || 'Beginner';
    const length = sessionData.length || body.length || 'Short';
    const messages = sessionData.messages || body.messages || [];
    const documents = sessionData.documents || body.documents || [];

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    const messagesJson = JSON.stringify(messages || []);
    const documentsJson = JSON.stringify(documents || []);
    const sessionLabel = label || (messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'Untitled Chat');

    const upsertSql = `
      INSERT INTO tab_tutor_sessions (id, user_id, type, label, mode, length, messages, documents, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        mode = VALUES(mode),
        length = VALUES(length),
        messages = VALUES(messages),
        documents = VALUES(documents),
        updated_at = NOW();
    `;

    await pool.query(upsertSql, [
      id,
      userId,
      type,
      sessionLabel,
      mode,
      length,
      messagesJson,
      documentsJson
    ]);

    return NextResponse.json({ ok: true, id, label: sessionLabel });
  } catch (err) {
    console.error('[TutorHistory POST] Error:', err);
    return NextResponse.json({ error: 'Failed to save tutor session', details: err.message }, { status: 500 });
  }
}

// DELETE /api/tutor/history?id=...&userId=...
export async function DELETE(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM tab_tutor_sessions WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('[TutorHistory DELETE] Error:', err);
    return NextResponse.json({ error: 'Failed to delete tutor session', details: err.message }, { status: 500 });
  }
}
