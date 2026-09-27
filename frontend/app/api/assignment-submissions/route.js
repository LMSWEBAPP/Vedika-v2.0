import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const dataFilePath = path.join(process.cwd(), 'data', 'assignment-submissions.json');

const DEFAULT_ASSIGNMENT_SUBMISSIONS = [
  {
    id: 'sub-fibonacci-1',
    assignment: 'assign-python-fibonacci',
    assignment_title: 'Implementing Fibonacci Sequence Generator',
    type: 'Text',
    member: 'alex.student@apex.edu',
    member_name: 'Alex Rivera',
    evaluator: '',
    status: 'Not Graded',
    question: 'Write a Python function fibonacci(n) that returns the first n Fibonacci numbers as a list. Hand in the source code file or code text.',
    answer: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    fib_series = [0, 1]
    for i in range(2, n):
        next_val = fib_series[-1] + fib_series[-2]
        fib_series.append(next_val)
    return fib_series`,
    course: '1',
    lesson: 'l2',
    timestamp: '2026-09-26T14:30:00.000Z'
  },
  {
    id: 'sub-fibonacci-2',
    assignment: 'assign-python-fibonacci',
    assignment_title: 'Implementing Fibonacci Sequence Generator',
    type: 'Text',
    member: 'priya.sharma@globaleng.edu',
    member_name: 'Priya Sharma',
    evaluator: '',
    status: 'Not Graded',
    question: 'Write a Python function fibonacci(n) that returns the first n Fibonacci numbers as a list. Hand in the source code file or code text.',
    answer: `def fibonacci(n):
    # Generates fibonacci list up to n elements
    res = []
    a, b = 0, 1
    for _ in range(n):
        res.append(a)
        a, b = b, a + b
    return res`,
    course: '1',
    lesson: 'l2',
    timestamp: '2026-09-26T15:10:00.000Z'
  },
  {
    id: 'sub-sorting-1',
    assignment: 'assign-dsa-sorting',
    assignment_title: 'Custom Merge Sort Complexity Analysis',
    type: 'Text',
    member: 'rahul.v@apex.edu',
    member_name: 'Rahul Verma',
    evaluator: '',
    status: 'Not Graded',
    question: 'Compare the computational complexity and space requirements of Merge Sort and In-place Quicksort. Submit a report explaining edge cases.',
    answer: `Merge Sort vs Quicksort Complexity Analysis:

1. Time Complexity:
- Merge Sort: Always O(N log N) in best, average, and worst cases because it consistently divides arrays in half and requires O(N) merge steps.
- Quicksort: Average case O(N log N), but worst-case degrades to O(N^2) if the pivot chosen is consistently the extreme element (e.g. already sorted array without randomized pivot).

2. Space Complexity:
- Merge Sort: O(N) auxiliary space required for temporary merge buffers.
- Quicksort: O(log N) stack space for recursive calls, operates in-place.

3. Stability:
- Merge Sort is stable (preserves relative order of duplicate elements).
- Standard Quicksort is unstable due to far-distance swaps.

4. Edge Cases:
- Empty array: handled in base case len <= 1.
- Duplicate values: Merge sort handles duplicates stably without performance penalty.`,
    course: '2',
    lesson: '2_m1',
    timestamp: '2026-09-26T16:45:00.000Z'
  }
];

async function readSubmissions() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {}
  // Initialize with defaults if file doesn't exist
  await writeSubmissions(DEFAULT_ASSIGNMENT_SUBMISSIONS);
  return DEFAULT_ASSIGNMENT_SUBMISSIONS;
}

async function writeSubmissions(data) {
  try {
    const dir = path.dirname(dataFilePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write assignment submissions file:', err.message);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const member = searchParams.get('member');

    let list = await readSubmissions();

    if (assignmentId && assignmentId !== 'all') {
      list = list.filter(s => String(s.assignment) === String(assignmentId));
    }
    if (member && member !== 'all') {
      const lower = member.toLowerCase();
      list = list.filter(s => (s.member && s.member.toLowerCase() === lower) || (s.member_name && s.member_name.toLowerCase() === lower));
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error in GET /api/assignment-submissions:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve assignment submissions.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const subData = body.submission || body;

    if (!subData.assignment || !subData.member) {
      return NextResponse.json({ error: 'Assignment ID and Member are required.' }, { status: 400 });
    }

    const list = await readSubmissions();

    // Check if user already submitted for this assignment
    const existingIndex = list.findIndex(
      s => s.assignment === subData.assignment && 
      (s.member?.toLowerCase() === subData.member?.toLowerCase() || 
       (subData.id && s.id === subData.id))
    );

    let record;
    if (existingIndex >= 0) {
      // Update existing submission instead of creating duplicate
      record = {
        ...list[existingIndex],
        ...subData,
        answer: subData.answer !== undefined ? subData.answer : list[existingIndex].answer,
        // Reset status to Not Graded if re-submitting an answer
        status: subData.status || (list[existingIndex].status === 'Pass' ? 'Pass' : 'Not Graded'),
        updated_at: new Date().toISOString()
      };
      list[existingIndex] = record;
    } else {
      record = {
        id: subData.id || `sub-ass-${Date.now()}`,
        status: 'Not Graded',
        comments: '',
        evaluator: '',
        score: null,
        ai_evaluation: null,
        ...subData,
        timestamp: new Date().toISOString()
      };
      list.unshift(record);
    }

    await writeSubmissions(list);
    return NextResponse.json({ status: 'success', submission: record });
  } catch (error) {
    console.error('Error in POST /api/assignment-submissions:', error.message);
    return NextResponse.json({ error: 'Failed to save assignment submission.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, comments, evaluator, score, ai_evaluation } = body;

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required.' }, { status: 400 });
    }

    const list = await readSubmissions();
    const index = list.findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    const updated = {
      ...list[index],
      status: status !== undefined ? status : list[index].status,
      comments: comments !== undefined ? comments : list[index].comments,
      evaluator: evaluator !== undefined ? evaluator : list[index].evaluator,
      score: score !== undefined ? score : list[index].score,
      ai_evaluation: ai_evaluation !== undefined ? ai_evaluation : list[index].ai_evaluation,
      graded_at: new Date().toISOString()
    };

    list[index] = updated;
    await writeSubmissions(list);

    return NextResponse.json({ status: 'success', submission: updated });
  } catch (error) {
    console.error('Error in PUT /api/assignment-submissions:', error.message);
    return NextResponse.json({ error: 'Failed to grade submission.' }, { status: 500 });
  }
}
