import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { authenticateRequest } from '@/lib/serverAuth';

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request, { requireAuth: false });
    if (!auth.authenticated && auth.response) return auth.response;

    const { code, puzzleId, stepIndex, stepDescription, problemStatement, allSteps } = await request.json();

    if (!code || stepDescription === undefined) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    if (typeof code === 'string' && code.length > 10000) {
      return NextResponse.json({ error: 'Code submission exceeds maximum limit (10,000 characters).' }, { status: 400 });
    }

    const systemInstruction = `You are a supportive, accurate programming tutor validating a student's code step-by-step.
Your task is to determine if the student's code has successfully completed the CURRENT step.
The student might not have written code for subsequent steps yet, which is expected. Do NOT mark it as failed just because later steps are missing. Only validate the requirements up to the current step.

If they have successfully completed the current step, return passed = true, line = 0, and message = "".
If they have NOT completed the current step correctly (or have a syntax/logic error in the code relevant to the step), identify the 1-based line number of the error and return a brief, single-line hint (max 15 words) explaining what is wrong and how to fix it.

CRITICAL RULES:
1. Do NOT return the entire corrected code block. Only provide a hint message.
2. The hint message must be a single line of text.
3. Make sure the 'line' number matches the exact 1-based line in the student's code where the error or missing logic is located.
4. If there is a syntax error anywhere in the code that prevents execution or parsing, return passed = false, the line number of the syntax error, and a comment explaining the syntax error.
5. ANY USER-CHOSEN VARIABLE NAME IS VALID: Never fail or penalize a student for choosing their own variable names or parameter names (even single-letter names like x, a, m, c). If the syntax and logic for the step are valid, you MUST return passed = true.
6. BEST PRACTICE SUGGESTION: If the student passes the step (passed = true) but used non-descriptive or single-letter variable names (like x, a, b), populate 'suggestion' with a friendly one-line coding best-practice tip encouraging descriptive variable names (e.g., "Good job! Tip: Using descriptive variable names like 'max_val' or 'total_count' makes your code easier to read in real-world projects."). Otherwise return suggestion = "".`;

    const userPrompt = `Overall Problem: ${problemStatement}
Steps list:
${(allSteps || []).map((s, idx) => `Step ${idx + 1}: ${s}`).join('\n')}

Current Step to Validate: Step ${stepIndex + 1} - "${stepDescription}"

Student's Python Code:
\`\`\`python
${code}
\`\`\`

Evaluate if Step ${stepIndex + 1} is correctly implemented in the code.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        passed: { type: "BOOLEAN", description: "Whether the current step is correctly implemented." },
        line: { type: "INTEGER", description: "The 1-based line number where the issue is, or 0 if passed is true." },
        message: { type: "STRING", description: "A short hint comment on how to fix the error, or empty if passed is true." },
        suggestion: { type: "STRING", description: "Optional non-blocking best-practice tip about descriptive variable naming when passed is true." }
      },
      required: ["passed", "line", "message"]
    };

    const result = await callGemini({
      userPrompt,
      systemInstruction,
      generationConfig: {
        temperature: 0.1,
      },
      jsonMode: true,
      responseSchema,
      maxRetries: 3
    });

    if (result.data) {
      return NextResponse.json(result.data);
    }

    try {
      const parsed = JSON.parse(result.text.trim());
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        passed: false,
        line: 1,
        message: "Code validation response could not be parsed. Please check your syntax."
      });
    }
  } catch (error) {
    console.error("[Code Puzzle API Handler Error]", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
