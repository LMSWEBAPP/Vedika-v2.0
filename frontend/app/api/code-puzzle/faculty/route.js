import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { callGemini } from '@/lib/gemini';
import { authenticateRequest } from '@/lib/serverAuth';

const DATA_FILE = path.join(process.cwd(), 'data', 'faculty-puzzles.json');

function readStoredPuzzles() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Faculty Puzzles API] Failed to read data file:', e.message);
  }
  return [];
}

function writeStoredPuzzles(puzzles) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(puzzles, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Faculty Puzzles API] Failed to write data file:', e.message);
  }
}

function buildLocalFallbackPuzzle(title, difficulty = 'Easy') {
  const cleanTitle = String(title || 'Custom Faculty Program').trim();
  const fnName = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_') || 'solve_problem';

  return {
    id: `faculty_${Date.now()}`,
    title: cleanTitle,
    difficulty: difficulty || 'Easy',
    description: `Write a Python function \`${fnName}(data)\` that solves "${cleanTitle}" and returns the computed result.`,
    sampleInput: `data = [10, 20, 30, 40]`,
    sampleOutput: `100`,
    constraints: ['Input size 1 <= n <= 10^5', 'Optimize for clean readability and descriptive variable names'],
    starterCode: `def ${fnName}(data):\n    pass\n`,
    defaultCall: `\n# Test call for visualizer\nsample_data = [10, 20, 30, 40]\nresult = ${fnName}(sample_data)\nprint('Input:', sample_data)\nprint('Result:', result)\n`,
    testCases: [
      { id: 1, name: 'Standard Case', input: '[10, 20, 30, 40]', expected: '100' },
      { id: 2, name: 'Single Element', input: '[5]', expected: '5' }
    ],
    steps: [
      { id: 'step1', shortTitle: 'Define Function', description: `Define the function signature \`def ${fnName}(data):\` (you may choose any clear parameter name).` },
      { id: 'step2', shortTitle: 'Initialize State', description: `Initialize a descriptive tracking variable (e.g., \`result = 0\` or \`output = []\`) indented 4 spaces inside the function.` },
      { id: 'step3', shortTitle: 'Iterate Input', description: `Write a loop (e.g., \`for item in data:\`) to process each element of the input.` },
      { id: 'step4', shortTitle: 'Core Logic', description: `Inside the loop (indented 8 spaces), apply the condition or computation required for ${cleanTitle} and update your tracking variable.` },
      { id: 'step5', shortTitle: 'Return Result', description: `Outside the loop (indented 4 spaces), return your final computed variable using \`return\`.` }
    ],
    createdAt: new Date().toISOString()
  };
}

export async function GET() {
  const puzzles = readStoredPuzzles();
  return NextResponse.json({ puzzles });
}

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request, { requireAuth: false });
    if (!auth.authenticated && auth.response) return auth.response;

    const body = await request.json();
    const title = String(body.title || '').trim();
    const difficulty = body.difficulty || 'Easy';

    if (!title) {
      return NextResponse.json({ error: 'Program name is required.' }, { status: 400 });
    }

    const systemInstruction = `You are Vedika AI, an expert Computer Science curriculum designer.
A faculty member has provided ONLY the name/topic of a programming exercise: "${title}" (Difficulty: ${difficulty}).
Your job is to generate the complete interactive Python coding puzzle so students can solve it step-by-step.

CRITICAL PEDAGOGICAL RULES:
1. Break the solution into 5 or 6 clear, incremental, beginner-friendly steps from function definition to returning the final result.
2. Each step description should clearly explain WHAT to do and include a brief illustrative pattern while reminding students they can use any descriptive variable names.
3. 'starterCode' must ONLY contain the function signature and a comment + 'pass' statement.
4. 'defaultCall' must invoke the function with sample data and print the result so the 2D visualizer can trace it.
5. Return strict JSON matching the schema.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        difficulty: { type: 'STRING' },
        description: { type: 'STRING' },
        sampleInput: { type: 'STRING' },
        sampleOutput: { type: 'STRING' },
        constraints: { type: 'ARRAY', items: { type: 'STRING' } },
        starterCode: { type: 'STRING' },
        defaultCall: { type: 'STRING' },
        steps: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              shortTitle: { type: 'STRING' },
              description: { type: 'STRING' }
            },
            required: ['id', 'shortTitle', 'description']
          }
        }
      },
      required: ['title', 'description', 'sampleInput', 'sampleOutput', 'starterCode', 'defaultCall', 'steps']
    };

    let puzzleData = null;
    try {
      const { data } = await callGemini({
        userPrompt: `Generate a step-by-step Python coding exercise for the faculty-assigned program: "${title}" (Difficulty: ${difficulty}).`,
        systemInstruction,
        generationConfig: { temperature: 0.4 },
        responseSchema,
        jsonMode: true,
        maxRetries: 2
      });
      if (data && Array.isArray(data.steps) && data.steps.length > 0) {
        puzzleData = {
          id: `faculty_${Date.now()}`,
          ...data,
          title: data.title || title,
          difficulty: data.difficulty || difficulty,
          createdAt: new Date().toISOString()
        };
      }
    } catch (aiErr) {
      console.warn('[Faculty Puzzles API] Gemini fallback triggered:', aiErr.message);
    }

    if (!puzzleData) {
      puzzleData = buildLocalFallbackPuzzle(title, difficulty);
    }

    const existing = readStoredPuzzles();
    const updated = [...existing, puzzleData];
    writeStoredPuzzles(updated);

    return NextResponse.json({ puzzle: puzzleData, puzzles: updated });
  } catch (err) {
    console.error('[Faculty Puzzles API Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = readStoredPuzzles();
    const updated = existing.filter(p => p.id !== id);
    writeStoredPuzzles(updated);

    return NextResponse.json({ puzzles: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: 500 });
  }
}
