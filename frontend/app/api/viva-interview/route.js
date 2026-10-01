import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import { callGemini } from '@/lib/gemini';

async function callGeminiWithRetry(contents, systemInstruction = '', generationConfig = {}, maxRetries = 3) {
  const result = await callGemini({
    contents,
    systemInstruction,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2500,
      thinkingConfig: { thinkingBudget: 0 },
      ...generationConfig
    },
    maxRetries
  });
  return result.text;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    let payload = verifyJwt(authHeader);
    if (!payload) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:jwt|token)=([^;]+)/);
      if (match) {
        payload = verifyJwt(match[1]);
      }
    }
    // Fail-open for academic interactive examination & viva practice
    if (!payload) {
      payload = { user_id: 'student@lms.com', role: 'Student', tenant_id: 'default_tenant' };
    }

    const body = await request.json();
    const { 
      action, type = 'viva', subject = 'Physics', topic = '', level = 'College', 
      difficulty = 'Medium', history = [], jdText = '', programmingLanguage = '', 
      experimentName = '', resumeBlueprint = null, resumeBase64 = null, 
      resumeMimeType = 'application/pdf', audioBase64 = null, audioMimeType = 'audio/webm', 
      questionIndex = 0
    } = body || {};

    // Input payload size constraints
    if (resumeBase64 && typeof resumeBase64 === 'string' && resumeBase64.length > 10 * 1024 * 1024 * 1.37) {
      return NextResponse.json({ error: 'Resume payload exceeds 10MB limit.' }, { status: 400 });
    }
    if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > 15 * 1024 * 1024 * 1.37) {
      return NextResponse.json({ error: 'Audio payload exceeds 15MB limit.' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // ACTION: PARSE RESUME
    // -------------------------------------------------------------
    if (action === 'parse-resume') {
      try {
        const contents = [];
        if (resumeBase64) {
          contents.push({
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: resumeMimeType,
                  data: resumeBase64.replace(/^data:.*?;base64,/, '')
                }
              },
              {
                text: `Analyze this resume document. Extract and return a clean JSON summary object with these exact keys:
{
  "name": "Candidate Name or 'Candidate'",
  "targetRole": "Primary title/specialization e.g. Fullstack Developer",
  "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experienceSummary": "1-2 sentence summary of experience level and core domains",
  "keyProjects": ["project or domain 1", "project or domain 2"]
}`
              }
            ]
          });
        } else {
          contents.push({
            role: 'user',
            parts: [{
              text: `Analyze this text content from a candidate's background/resume:\n"${(jdText || topic).slice(0, 3000)}"\n
Extract and return a clean JSON summary object:
{
  "name": "Candidate",
  "targetRole": "Primary specialization",
  "keySkills": ["skill1", "skill2", "skill3"],
  "experienceSummary": "1-2 sentence background summary",
  "keyProjects": ["project or domain 1"]
}`
            }]
          });
        }

        const rawJson = await callGeminiWithRetry(
          contents,
          'You are an expert HR and technical resume parser. Output ONLY valid JSON matching the schema.',
          { responseMimeType: 'application/json', temperature: 0.2 }
        );

        let cleanJson = rawJson.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({ blueprint: parsed });
      } catch (err) {
        console.error('[Viva API] Parse resume error:', err);
        return NextResponse.json({
          blueprint: {
            name: 'Candidate',
            targetRole: programmingLanguage || 'Software Developer',
            keySkills: [programmingLanguage || 'Technical Skills'],
            experienceSummary: 'Candidate profile configured for technical evaluation.',
            keyProjects: []
          }
        });
      }
    }

    // -------------------------------------------------------------
    // ACTION: TRANSCRIBE AUDIO (Safari / Firefox MediaRecorder fallback)
    // -------------------------------------------------------------
    if (action === 'transcribe-audio') {
      if (!audioBase64) {
        return NextResponse.json({ error: 'Missing audioBase64 parameter.' }, { status: 400 });
      }

      try {
        const contents = [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: audioMimeType,
                data: audioBase64.replace(/^data:.*?;base64,/, '')
              }
            },
            {
              text: 'Transcribe this spoken English audio exactly into text. Output ONLY the plain transcription text without commentary or prefixes.'
            }
          ]
        }];

        const transcription = await callGeminiWithRetry(
          contents,
          'You are an ultra-accurate speech-to-text transcriber for academic and technical interviews. Output only spoken text.',
          { temperature: 0.1 }
        );

        return NextResponse.json({ text: transcription.trim() });
      } catch (err) {
        console.error('[Viva API] Audio transcription error:', err);
        return NextResponse.json({ error: 'Audio transcription failed. Please try voice again or type your answer.' }, { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // ACTION: GENERATE QUESTION (Strict Examiner Persona - No Spoilers)
    // -------------------------------------------------------------
    if (action === 'question') {
      let contextText = '';
      if (type === 'viva') {
        const targetExp = experimentName || topic || 'Core Laboratory Experiment';
        contextText = `Subject: ${subject}\nAcademic Experiment/Topic: "${targetExp}"\nStudent Level: ${level}\nChosen Difficulty: ${difficulty.toUpperCase()} (${difficulty === 'Easy' ? 'basic definitions & standard formulas' : difficulty === 'Hard' ? 'advanced derivations, non-ideal conditions, error analysis & edge cases' : 'standard academic analytical questions'}).`;
      } else {
        // Technical Interview
        const stack = programmingLanguage || topic || 'Fullstack Engineering';
        let resumeDetails = '';
        if (resumeBlueprint) {
          resumeDetails = `\nCandidate Blueprint:\n- Role: ${resumeBlueprint.targetRole || 'Developer'}\n- Skills: ${(resumeBlueprint.keySkills || []).join(', ')}\n- Background: ${resumeBlueprint.experienceSummary || ''}`;
        }
        let jdDetails = jdText ? `\nTarget Job Description / Requirements:\n"${jdText.slice(0, 600)}..."` : '';
        contextText = `Target Stack/Domain: ${stack}\nTarget Seniority: ${level} Engineer\nChosen Difficulty: ${difficulty.toUpperCase()} (${difficulty === 'Easy' ? 'syntax fundamentals & standard patterns' : difficulty === 'Hard' ? 'low-level runtime internals, high-scale bottlenecks & failure modes' : 'production architecture & problem solving'})${resumeDetails}${jdDetails}`;
      }

      const isFirstQuestion = questionIndex === 0 && history.length === 0;
      const recentQ1s = Array.isArray(body.recentQ1s) ? body.recentQ1s : [];
      let recentQ1Text = '';
      if (recentQ1s.length > 0) {
        recentQ1Text = `\nANTI-REPETITION MANDATE: The candidate recently answered these opening questions in previous sessions for this topic:\n${recentQ1s.map((q, i) => `- "${q}"`).join('\n')}\nYou MUST NOT repeat any of these questions or test the exact same sub-topic concept as Question 1.`;
      }

      let dynamicQuestionInstruction = '';
      if (isFirstQuestion) {
        dynamicQuestionInstruction = `\nDYNAMIC OPENING QUESTION FOR QUESTION 1:
- Dynamically identify 5 distinct core sub-topic pillars within "${experimentName || topic || subject || programmingLanguage}" appropriate for a ${level} level examination.
- Select ONE specific foundational sub-topic pillar to test for this session's opening question.
- Do NOT default to generic textbook definitions or the single most common entry-level opening question. Pick a specific, meaningful core concept pillar.
${recentQ1Text}`;
      } else if (history.length > 0) {
        const lastTurn = history[history.length - 1];
        const prevAnswer = (lastTurn.answer || '').trim();
        const prevQuestion = (lastTurn.question || '').trim();
        
        dynamicQuestionInstruction = `\nCONVERSATIONAL FOLLOW-UP PROBING MANDATE (CRITICAL):
This is Turn ${questionIndex + 1} of 5. You are having an ongoing, person-to-person inquiry with the candidate.
The candidate just responded to the previous question:
- Previous Question: "${prevQuestion}"
- Candidate's Exact Response: "${prevAnswer || '(No response provided / Skipped)'}"

YOUR TASK FOR THIS FOLLOW-UP ROUND:
1. Actively listen to what the candidate actually said in their answer above.
2. Pick up on a SPECIFIC point, keyword, formula, claim, assumption, or omission from their answer.
3. In "probedPoint", identify the exact concept or claim you are probing (e.g., "slit width vs fringe spacing relationship", "Redis LRU eviction vs TTL expiration", "error propagation in focal length measurement").
4. In "acknowledgment", provide a warm, natural human reaction that directly references their idea (e.g., "Good observation about the index scan.", "I see your point on the temperature coefficient.", "Fair intuition regarding write throughput."). Keep it under 15 words.
5. In "question", ask an organic, deep-dive FOLLOW-UP PROBE that drills into that exact point:
   - Challenge their claim with a what-if scenario ("You mentioned X—what happens if parameter Y doubles?").
   - Ask how they would handle a real-world edge case ("Building on your point about X, how would that behave under heavy concurrent writes?").
   - Probe a missing nuance ("You touched on X, but how does that account for non-ideal resistance in the circuit?").
6. Set "questionType" to "follow_up".
7. NEVER ask a generic or completely disconnected question when a candidate has just answered. Build directly upon their train of thought so the examination feels like an authentic, interactive learning conversation between two people.`;
      }

      const systemInstruction = `You are a real, highly experienced, authentic, and engaging ${type === 'viva' ? 'University Professor conducting an in-person academic viva defense' : 'Senior/Staff Software Engineer conducting a live technical interview'}.
Context:
${contextText}

Question Index: ${questionIndex + 1} of 5.
Difficulty Tier: ${difficulty.toUpperCase()}.
${dynamicQuestionInstruction}

HUMAN CONVERSATIONAL GUIDELINES:
1. Speak like a real human sitting across from the candidate or on a live video call—warm, articulate, natural, and conversational.
2. STRICTLY AVOID robotic, AI-sounding formulas like "What is the primary physical principle underlying...", "Explain the advantages and disadvantages of...", or dry textbook definition requests.
3. GROUND QUESTIONS IN REAL SCENARIOS & THOUGHT EXPERIMENTS:
   ${type === 'viva' ? `
   - For Viva: Ask intuitive laboratory scenarios, what-if parameter changes, and real physical observations.
     Example style: "Welcome! Let's say we're setting up this experiment in the lab. If we suddenly double the slit distance while keeping the wavelength constant, walk me through what happens to the interference fringes on our screen and why."
     Example style: "Good point. Now suppose our meter readings kept drifting higher over 20 minutes. What physical phenomenon in the apparatus is most likely causing that, and how would you correct for it?"
   ` : `
   - For Technical Interview: Ask practical engineering situations, trade-offs, production incidents, or architecture decisions.
     Example style: "Nice to meet you! Let's say you're building a real-time caching service handling heavy concurrent writes. How would you choose between an in-memory LRU cache and an external store like Redis for this case?"
     Example style: "Makes sense. Quick follow-up: what happens if two worker threads attempt to update the same record at the exact same millisecond? How would you guard against race conditions here?"
   `}
4. KEEP IT NATURAL & SPOKEN: Exactly ONE focused question (maximum 2 sentences), using natural conversational phrasing like "Walk me through...", "Let's say you're...", "Suppose we...", "How would you handle...", "What happens if...".
5. NEVER provide answers, hints, solutions, scores, or evaluations yourself during the questioning phase. You are assessing the candidate.
6. ACKNOWLEDGMENT & RELEVANCE:
   - If Question 1, offer a warm, natural human greeting: e.g. "Glad to have you here! Let's get started with your ${difficulty.toLowerCase()} session."
   - For subsequent questions, react like a real human: briefly acknowledge their specific response in a conversational way (e.g. "Good insight on that.", "Fair point on the indexing trade-off.", "I see your reasoning there—let's take that a step further.").
   - If their answer was clearly off-topic or evasive, gently steer them back: "I see, but that doesn't quite address our question on ${topic || subject}. Let's bring the focus back..."
7. TOPIC VALIDATION (Mandatory for Question 1):
   - Set "isValidTopic" to true for legitimate technical, scientific, or academic topics.
   - Set "isValidTopic" to false only for random gibberish or pure greetings ("asdf", "hello", "1234").

Output ONLY a valid JSON object matching this schema:
{
  "isValidTopic": true,
  "rejectionReason": "If topic is invalid, short 1-sentence reason. Leave empty if valid.",
  "questionType": "${isFirstQuestion ? 'main' : 'follow_up'}",
  "probedPoint": "Short label of specific point or parameter probed from their answer (or 'Foundational Concept' for Q1)",
  "acknowledgment": "Conversational, natural human acknowledgment (max 15 words)",
  "question": "The conversational, human-phrased question ending with a question mark"
}`;

      let conversationHistory = '';
      if (history.length > 0) {
        conversationHistory = 'Transcript of previous turns in this session:\n';
        history.forEach((h, idx) => {
          conversationHistory += `Q${idx + 1}: ${h.question}\nCandidate A${idx + 1}: ${h.answer || '(No answer provided)'}\n`;
        });
        conversationHistory += `\nNow formulate Question ${questionIndex + 1} of 5 (${difficulty} Difficulty) as an organic follow-up probe anchored on Candidate A${history.length}:`;
      } else {
        conversationHistory = `This is the start of the session. Formulate the first opening question (Question 1 of 5 at ${difficulty} Difficulty).`;
      }

      try {
        const rawJson = await callGeminiWithRetry(
          [{ role: 'user', parts: [{ text: conversationHistory }] }],
          systemInstruction,
          { responseMimeType: 'application/json', temperature: difficulty === 'Hard' ? 0.75 : 0.6 }
        );

        let cleanJson = rawJson.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({
          isValidTopic: parsed.isValidTopic !== false,
          rejectionReason: parsed.rejectionReason || '',
          questionType: parsed.questionType || (isFirstQuestion ? 'main' : 'follow_up'),
          probedPoint: parsed.probedPoint || (isFirstQuestion ? 'Foundational Concept' : 'Core Mechanism'),
          acknowledgment: parsed.acknowledgment || (questionIndex === 0 ? "Glad to have you here! Let's get started." : 'Understood. Let us proceed.'),
          question: parsed.question || 'Could you walk me through the core principles behind this concept?'
        });
      } catch (err) {
        console.error('[Viva API] Question generation error, using fallback:', err);
        const fallbackQuestionsViva = [
          `Let's start with the basics: if you were explaining the core intuition behind "${experimentName || topic}" to a junior student, what real-world example would you use?`,
          `Suppose during your lab measurement, your readings keep drifting higher over 15 minutes. What physical effect is most likely causing that, and how would you correct it?`,
          `Walk me through what would happen to your measured outcome if we doubled the primary input parameter in this setup.`,
          `What assumptions did we make in the theoretical derivation that might not hold true in a real physical laboratory?`,
          `Before turning on the apparatus, what specific calibration step is most critical to avoid systematic measurement error?`
        ];

        const fallbackQuestionsInterview = [
          `Let's dive in: walk me through how you would architect a production service in ${programmingLanguage || 'this stack'} to handle unexpected spikes in traffic.`,
          `Suppose a background job starts silently failing in production under concurrent load. Where would you look first, and how would you reproduce the bug?`,
          `How do you decide between synchronous execution and asynchronous worker queues when designing latency-critical APIs?`,
          `Walk me through a difficult edge case or race condition you encountered recently and how you resolved it.`,
          `If your database query response times suddenly tripled after a new deployment, what systematic steps would you take to diagnose it?`
        ];

        const fallbackList = type === 'viva' ? fallbackQuestionsViva : fallbackQuestionsInterview;
        const qText = fallbackList[Math.min(questionIndex, fallbackList.length - 1)];

        return NextResponse.json({
          isValidTopic: true,
          rejectionReason: '',
          questionType: isFirstQuestion ? 'main' : 'follow_up',
          probedPoint: isFirstQuestion ? 'Foundational Concept' : 'Core Mechanism',
          acknowledgment: questionIndex === 0 ? `Welcome to your ${difficulty.toLowerCase()} session! Let's get started.` : 'Understood. Let us proceed.',
          question: qText
        });
      }
    }

    // -------------------------------------------------------------
    // ACTION: EVALUATE SESSION (Comprehensive Post-Viva Diagnostic Report)
    // -------------------------------------------------------------
    if (action === 'evaluate-session') {
      const targetDomain = (experimentName || topic || subject || programmingLanguage || '').trim();
      if (!targetDomain) {
        return NextResponse.json({ error: 'Missing evaluation topic or subject parameter. Session evaluation blocked.' }, { status: 400 });
      }

      const topicUnitsInput = body.topicUnits || [];
      const historyInput = history || [];

      // Group raw history turns into TopicUnits if topicUnits wasn't directly passed
      let topicUnits = [...topicUnitsInput];
      if (topicUnits.length === 0 && historyInput.length > 0) {
        let currentUnit = null;
        historyInput.forEach((h, idx) => {
          const isFollowUp = h.questionType === 'follow_up' || /follow-up|probing/i.test(h.question || '') || idx > 0;
          if (!currentUnit || (!isFollowUp && currentUnit.turns.length > 0)) {
            if (currentUnit) topicUnits.push(currentUnit);
            currentUnit = {
              topicIndex: topicUnits.length + 1,
              topicName: h.topicName || `${targetDomain} - Pillar ${topicUnits.length + 1}`,
              turns: []
            };
          }
          currentUnit.turns.push({
            questionType: isFollowUp ? 'follow_up' : 'main',
            probedPoint: h.probedPoint || (isFollowUp ? 'Follow-up Probe' : 'Core Concept'),
            question: h.question,
            answer: h.answer,
            durationSec: h.durationSec || 30
          });
        });
        if (currentUnit && currentUnit.turns.length > 0) {
          topicUnits.push(currentUnit);
        }
      }

      // Flatten all turns for turn-by-turn analysis guarantees
      const allInputTurns = topicUnits.flatMap((u, uIdx) => (u.turns || []).map((t, tIdx) => ({
        ...t,
        topicName: u.topicName,
        topicIndex: uIdx + 1
      })));

      const nTopics = Math.max(1, topicUnits.length);

      // RULE 1: Zero-Division & Crash Guard
      if (allInputTurns.length === 0) {
        return NextResponse.json({
          overallScore: 0,
          letterGrade: 'Incomplete',
          summaryCritique: 'The examination session ended before any questions were answered.',
          rubricBreakdown: {
            technicalAccuracy: { score: 0, feedback: 'No question data recorded.' },
            problemSolving: { score: 0, feedback: 'No question data recorded.' },
            communicationClarity: { score: 0, feedback: 'No question data recorded.' }
          },
          turnByTurnAnalysis: [],
          perTopicAnalysis: [],
          strengths: [],
          criticalImprovements: ['Attempt questions to receive an official evaluation.'],
          recommendedStudyTopics: [topic || subject || 'Core Principles']
        });
      }

      let contextSummary = '';
      if (type === 'viva') {
        contextSummary = `Academic Viva Examination on "${experimentName || topic}" in ${subject} (${level} level, ${difficulty} difficulty). Total Questions Attempted: ${allInputTurns.length}.`;
      } else {
        contextSummary = `Technical Job Interview on ${programmingLanguage || topic} for a ${level} position (${difficulty} difficulty). Total Questions Attempted: ${allInputTurns.length}. ${jdText ? `Target JD: ${jdText.slice(0, 300)}` : ''}`;
      }

      const systemInstruction = `You are a distinguished academic professor and senior hiring committee director.
Perform a rigorous, objective, post-session evaluation of the examination conducted at ${difficulty.toUpperCase()} difficulty.

Evaluation Context:
${contextSummary}

CRITICAL POST-SESSION EVALUATION & DIAGNOSTIC RULES (MANDATORY):
1. STRICT CONCEALMENT HAS ENDED: The examination has officially finished. Now provide a full, transparent diagnostic breakdown.
2. TURN-BY-TURN / QUESTION-BY-QUESTION ANALYSIS (Highest Priority):
   For EVERY question in the transcript (both main questions and follow-up probes):
   - "turnNumber": Integer (1 to N) matching the question order.
   - "questionType": "main" or "follow_up".
   - "probedPoint": Specific concept or parameter probed.
   - "question": The exact question asked.
   - "candidateAnswer": The candidate's response.
   - "scoreOutOfTen": Integer (0 to 10) calibrated strictly to ${level} expectations.
   - "whatWentWell": Specific accurate points, correct terminology, and good technical intuition demonstrated by the candidate.
   - "whatCanBeImproved": Concrete missing details, misconceptions, omitted boundary conditions, or missed trade-offs in their response.
   - "bestModelAnswer": The exemplary, gold-standard model answer demonstrating complete depth, exact scientific/engineering terminology, governing formulas/code concepts, and structured reasoning.
   - "keyImprovementTip": Direct, actionable advice on how the candidate can refine and elevate their answer for the next interview round.
3. HOLISTIC RUBRIC (0-10 Scale):
   - Technical Accuracy & Depth (50% weight): Correctness against required technical facts for ${level} level.
   - Problem Solving & Adaptability (30% weight): Handling of probed follow-ups and edge cases.
   - Communication Clarity (20% weight): Articulation and structure appropriate for ${level} level.
4. DOMAIN RELEVANCE:
   - If candidate response was off-topic or substituted unrelated domain concepts, reflect that in low scores and explicit gaps.
5. SKIPPED / TIMED-OUT QUESTIONS:
   - If candidate skipped or gave no answer, assign 0/10 with an explanation of what was missed and the complete best model answer so the candidate learns.

Return ONLY a valid JSON object matching this schema:
{
  "summaryCritique": "2 to 3 sentences executive review of candidate overall performance, depth, and pacing",
  "strengths": ["Demonstrated strength 1", "Demonstrated strength 2"],
  "criticalImprovements": ["Priority improvement 1", "Priority improvement 2"],
  "recommendedStudyTopics": ["Topic 1 to study", "Topic 2 to study"],
  "turnByTurnAnalysis": [
    {
      "turnNumber": 1,
      "questionType": "main",
      "probedPoint": "Foundational Concept",
      "question": "The question asked",
      "candidateAnswer": "What candidate answered",
      "scoreOutOfTen": 8,
      "whatWentWell": "Strengths in candidate answer",
      "whatCanBeImproved": "Gaps and missing aspects",
      "bestModelAnswer": "Exemplary gold-standard answer",
      "keyImprovementTip": "Actionable advice for next round"
    }
  ],
  "perTopicAnalysis": [
    {
      "topicIndex": 1,
      "topicName": "Sub-topic title",
      "turnsCount": 1,
      "candidateClaims": "Claims stated",
      "levelCalibratedReferenceFacts": "Required facts",
      "matchedConcepts": ["Matched 1"],
      "missingConcepts": ["Missing 1"],
      "keyGaps": "Key gap note",
      "rubric": {
        "technicalAccuracy": 8,
        "problemSolving": 8,
        "communicationClarity": 8
      }
    }
  ]
}`;

      let transcriptText = `FULL EXAMINATION TRANSCRIPT (${difficulty.toUpperCase()} DIFFICULTY):\n\n`;
      allInputTurns.forEach((t, idx) => {
        let cleanAnswer = (t.answer || '').trim();
        cleanAnswer = cleanAnswer.replace(/^(can you repeat|please repeat|repeat it|say again|pardon|i didn't catch that|could you rephrase)[,.\s?!]+/i, '').trim() || cleanAnswer;
        transcriptText += `[Turn ${idx + 1} - ${t.questionType === 'follow_up' ? 'Follow-up Probe' : 'Main Question'}]: ${t.question}\nCandidate Answer: "${cleanAnswer || '(No response recorded / Timed out)'}"\n\n`;
      });

      try {
        const rawJson = await callGeminiWithRetry(
          [{ role: 'user', parts: [{ text: transcriptText }] }],
          systemInstruction,
          { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 3500 }
        );

        let cleanJson = rawJson.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const scorecard = JSON.parse(cleanJson);

        // Process and guarantee turn-by-turn analysis completeness
        let processedTurns = Array.isArray(scorecard.turnByTurnAnalysis) ? scorecard.turnByTurnAnalysis : [];
        const existingTurnMap = new Map();
        processedTurns.forEach((pt) => {
          if (pt.question) existingTurnMap.set(pt.question.trim().toLowerCase(), pt);
        });

        scorecard.turnByTurnAnalysis = allInputTurns.map((turn, idx) => {
          const key = (turn.question || '').trim().toLowerCase();
          const existing = existingTurnMap.get(key) || processedTurns[idx];
          const isSkipped = !turn.answer || /skip|timed out/i.test(turn.answer);

          if (existing) {
            return {
              turnNumber: idx + 1,
              questionType: existing.questionType || turn.questionType || (idx === 0 ? 'main' : 'follow_up'),
              probedPoint: existing.probedPoint || turn.probedPoint || (idx === 0 ? 'Foundational Concept' : 'Core Mechanism & Behavior'),
              question: turn.question,
              candidateAnswer: turn.answer || '(No response recorded / Skipped)',
              scoreOutOfTen: typeof existing.scoreOutOfTen === 'number' ? Math.min(10, Math.max(0, existing.scoreOutOfTen)) : (isSkipped ? 0 : 7),
              whatWentWell: existing.whatWentWell || (isSkipped ? 'No response provided.' : 'Attempted to address the question directly.'),
              whatCanBeImproved: existing.whatCanBeImproved || (isSkipped ? 'Candidate skipped or timed out on this turn.' : 'Expand on governing formulas and practical edge cases.'),
              bestModelAnswer: existing.bestModelAnswer || `An exemplary answer for "${turn.question}" defines key concepts, states governing equations or system architectures, and explains practical boundary conditions.`,
              keyImprovementTip: existing.keyImprovementTip || 'Structure responses with: direct definition, underlying mechanism, and real-world example.'
            };
          }

          return {
            turnNumber: idx + 1,
            questionType: turn.questionType || (idx === 0 ? 'main' : 'follow_up'),
            probedPoint: turn.probedPoint || (idx === 0 ? 'Foundational Concept' : 'Analytical Drill-Down'),
            question: turn.question,
            candidateAnswer: turn.answer || '(No response recorded / Skipped)',
            scoreOutOfTen: isSkipped ? 0 : 7,
            whatWentWell: isSkipped ? 'No answer was submitted for this question.' : 'Engaged with the question directly.',
            whatCanBeImproved: isSkipped ? 'Candidate skipped or timed out on this question.' : 'Review key technical nuances, edge cases, and governing formulas.',
            bestModelAnswer: `An exemplary response clearly defines the core concept, details governing equations or architecture components, and highlights real-world trade-offs.`,
            keyImprovementTip: 'Practice structured verbal delivery under timed constraints.'
          };
        });

        // Compute overall scores from turn-by-turn scores to ensure perfect consistency
        const scoredTurns = scorecard.turnByTurnAnalysis.map(t => t.scoreOutOfTen);
        const meanTurnScore = scoredTurns.length > 0 
          ? (scoredTurns.reduce((a, b) => a + b, 0) / scoredTurns.length) 
          : 0;

        const rawMeanTopicScore = Number(meanTurnScore.toFixed(1));
        const coverageFactor = allInputTurns.length >= 4 ? 1.0 : (allInputTurns.length >= 2 ? 0.90 : 0.75);
        const calculatedScore = Math.min(100, Math.max(0, Math.round(rawMeanTopicScore * 10 * coverageFactor)));

        let letterGrade = 'F';
        if (allInputTurns.length < 2) letterGrade = 'Incomplete';
        else if (calculatedScore >= 90) letterGrade = 'A+';
        else if (calculatedScore >= 80) letterGrade = 'A';
        else if (calculatedScore >= 70) letterGrade = 'B+';
        else if (calculatedScore >= 60) letterGrade = 'B';
        else if (calculatedScore >= 50) letterGrade = 'C';
        else if (calculatedScore >= 40) letterGrade = 'D';
        else letterGrade = 'F';

        // Calibrate rubric breakdown
        if (!scorecard.rubricBreakdown) {
          scorecard.rubricBreakdown = {
            technicalAccuracy: {
              score: Math.min(10, Math.round(rawMeanTopicScore)),
              feedback: `Evaluated across ${allInputTurns.length} question(s) against ${level} expectations.`
            },
            problemSolving: {
              score: Math.min(10, Math.round(rawMeanTopicScore * 0.95)),
              feedback: `Evaluated across follow-up scenarios and analytical probing.`
            },
            communicationClarity: {
              score: Math.min(10, Math.round(rawMeanTopicScore * 1.05)),
              feedback: `Evaluated across articulation structure and domain relevance.`
            }
          };
        }

        return NextResponse.json({
          ...scorecard,
          nTopics: allInputTurns.length,
          totalQuestionsAsked: allInputTurns.length,
          rawMeanTopicScore,
          coverageFactor: Number(coverageFactor.toFixed(2)),
          overallScore: calculatedScore,
          letterGrade
        });
      } catch (err) {
        console.error('[Viva API] Session evaluation JSON parsing or generation error:', err);
        
        // System error fallback: produce complete diagnostic analysis
        const turnByTurnFallback = allInputTurns.map((t, idx) => {
          const ans = (t.answer || '').trim();
          const isSkipped = !ans || /skip|timed out/i.test(ans);
          return {
            turnNumber: idx + 1,
            questionType: t.questionType || (idx === 0 ? 'main' : 'follow_up'),
            probedPoint: t.probedPoint || (idx === 0 ? 'Foundational Concept' : 'Core Mechanism'),
            question: t.question,
            candidateAnswer: ans || '(No response recorded / Skipped)',
            scoreOutOfTen: isSkipped ? 0 : 7,
            whatWentWell: isSkipped ? 'No response submitted.' : 'Demonstrated basic domain familiarity and attempted the question.',
            whatCanBeImproved: isSkipped ? 'Turn was skipped or timed out.' : 'Provide deeper theoretical derivations, precise terminology, and practical edge cases.',
            bestModelAnswer: `A comprehensive answer for "${t.question}" details theoretical principles, real-world constraints, and systematic problem solving.`,
            keyImprovementTip: 'Structure oral responses with: 1. Direct answer, 2. Underlying mechanism, 3. Practical example.'
          };
        });

        const scoredScores = turnByTurnFallback.map(t => t.scoreOutOfTen);
        const rawMeanScore = scoredScores.length > 0 ? scoredScores.reduce((a, b) => a + b, 0) / scoredScores.length : 0;
        const calculatedScore = Math.round(rawMeanScore * 10);

        let letterGrade = 'F';
        if (allInputTurns.length < 2) letterGrade = 'Incomplete';
        else if (calculatedScore >= 90) letterGrade = 'A+';
        else if (calculatedScore >= 80) letterGrade = 'A';
        else if (calculatedScore >= 70) letterGrade = 'B+';
        else if (calculatedScore >= 60) letterGrade = 'B';
        else if (calculatedScore >= 50) letterGrade = 'C';
        else if (calculatedScore >= 40) letterGrade = 'D';
        else letterGrade = 'F';

        return NextResponse.json({
          overallScore: calculatedScore,
          letterGrade,
          rawMeanTopicScore: Number(rawMeanScore.toFixed(1)),
          coverageFactor: 1.0,
          totalQuestionsAsked: allInputTurns.length,
          nTopics: allInputTurns.length,
          summaryCritique: `The candidate completed ${allInputTurns.length} question turn(s) on ${targetDomain}. Answers demonstrated active participation with clear opportunities to add rigor in theoretical mechanics and edge case handling.`,
          rubricBreakdown: {
            technicalAccuracy: { score: Math.round(rawMeanScore), feedback: 'Evaluated based on attempted questions.' },
            problemSolving: { score: Math.round(rawMeanScore * 0.9), feedback: 'Evaluated across probed follow-up scenarios.' },
            communicationClarity: { score: Math.round(rawMeanScore), feedback: 'Articulation clarity across available turns.' }
          },
          turnByTurnAnalysis: turnByTurnFallback,
          perTopicAnalysis: [],
          strengths: ['Active participation across interview questions', 'Clear communicative effort on foundational concepts'],
          criticalImprovements: ['Review fundamental governing laws and formulas', 'Incorporate concrete real-world examples and trade-offs'],
          recommendedStudyTopics: [topic || subject || 'Core Principles']
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error) {
    console.error('[Viva API] Global exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
