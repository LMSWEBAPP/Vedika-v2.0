export function extractContentHeuristic(response, question) {
  const cleanResponse = (response || "").trim();
  const lower = cleanResponse.toLowerCase();
  const lines = cleanResponse.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sentences = cleanResponse
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  // 1. Detect Core Subject / Topic (skipping conversational analogy openers)
  let detectedTopic = "";
  const isAnalogyOpener = /^(imagine\s+|suppose\s+|consider\s+|think of\s+|have you ever\s+|let's\s+|picture this\s+)/i.test(sentences[0] || "");

  // A. Check for subject definitions in text: "The [Topic] is / refers to / stands for..."
  const definitionMatch = cleanResponse.match(
    /(?:The\s+)?([A-Z0-9][A-Za-z0-9\s/–-]{2,40}?)\s+(?:is\s+(?:the|a|an|defined\s+as)|refers\s+to|stands\s+for|describes|works\s+by|consists\s+of)/i
  );
  if (definitionMatch && !/^(it|this|that|which|one|there|here|what|how)\b/i.test(definitionMatch[1].trim())) {
    detectedTopic = definitionMatch[1].trim();
  }

  // B. Fallback: Check capitalized terms / acronyms (e.g. TCP/IP, SDLC, REST API, DNS)
  if (!detectedTopic) {
    const acronymMatch = cleanResponse.match(/\b([A-Z]{2,6}(?:\/[A-Z]{2,6})?(?:\s+[A-Za-z0-9-]+){0,3})\b/);
    if (acronymMatch && acronymMatch[1].length > 2 && !/^(THE|AND|FOR|NOT|BUT|WITH|YOU)\b/i.test(acronymMatch[1])) {
      detectedTopic = acronymMatch[1].trim();
    }
  }

  // C. Fallback: If clean question exists
  if (!detectedTopic && question && question.length > 5) {
    const qClean = question.replace(/^(how\s+does|what\s+is|explain|describe|outline)\s+/i, "").replace(/[?.]+$/, "").trim();
    if (qClean.length > 3) detectedTopic = qClean;
  }

  // Primary core idea thesis
  let coreIdea = sentences[0] || cleanResponse.slice(0, 120);
  if (isAnalogyOpener && sentences.length > 1) {
    const defSentence = sentences.find((s) =>
      /\b(is\s+(?:the|a|an)|refers\s+to|stands\s+for|process\s+by\s+which|protocol|structured\s+into|evolved\s+across)\b/i.test(s)
    );
    coreIdea = defSentence || sentences[1];
  }

  // 2. Detect numeric data (percentages, statistics, counts)
  const numericData = [];
  const statRegex = /([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+(?:achieved|scored|trailed at|reached|is|was|at|of))?\s*[:=–-]?\s*(\d+(?:\.\d+)?)\s*(%|percent|ms|s|kg|m|units|users|GB|MB)/gi;
  let statMatch;
  while ((statMatch = statRegex.exec(cleanResponse)) !== null) {
    const rawLabel = statMatch[1].replace(/^(while|and|or|in|overall)\s+/i, "").trim();
    const val = parseFloat(statMatch[2]);
    const unit = statMatch[3];
    if (!isNaN(val) && rawLabel.length > 2) {
      numericData.push({ label: rawLabel.slice(-20), value: val, unit });
    }
  }

  if (numericData.length < 2) {
    const pctMatches = [...cleanResponse.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
    let pIdx = 1;
    for (const m of pctMatches) {
      numericData.push({ label: `Metric ${pIdx++}`, value: parseFloat(m[1]), unit: "%" });
    }
  }

  // 3. Identify structure type
  const isSoftware =
    lower.includes("software") ||
    lower.includes("sdlc") ||
    lower.includes("program") ||
    lower.includes("developer") ||
    lower.includes("testing") ||
    lower.includes("edge case") ||
    lower.includes("code");

  const qLower = (question || "").toLowerCase();

  const isTimeline =
    /\b(19\d\d|20\d\d|18\d\d)s?\b/i.test(cleanResponse) &&
    (lower.includes("history") || lower.includes("evolution") || lower.includes("chronological") || lower.includes("eras") || lower.includes("milestone") || qLower.includes("timeline") || qLower.includes("history"));

  const isComparison =
    qLower.includes("compare") ||
    qLower.includes("versus") ||
    /\bvs\.?\b/i.test(qLower) ||
    /\bdifference\b/i.test(qLower) ||
    /\bvs\.?\b/i.test(cleanResponse) ||
    /\bversus\b/i.test(cleanResponse) ||
    lower.includes("difference between") ||
    lower.includes("in contrast") ||
    lower.includes("on the other hand") ||
    lower.includes("compared to") ||
    (/\btcp\b/i.test(cleanResponse) && /\budp\b/i.test(cleanResponse)) ||
    (/\bram\b/i.test(cleanResponse) && /\brom\b/i.test(cleanResponse));

  const isScientific =
    !isSoftware &&
    (lower.includes("photosynthesis") ||
     lower.includes("chloroplast") ||
     lower.includes("cell membrane") ||
     lower.includes("mitochondria") ||
     lower.includes("chemical equation") ||
     lower.includes("atomic nucleus") ||
     lower.includes("structure of an atom") ||
     lower.includes("respiratory system") ||
     lower.includes("alveoli") ||
     lower.includes("electron"));

  const isCycle =
    lower.includes("water cycle") ||
    lower.includes("hydrologic") ||
    lower.includes("closed-loop") ||
    lower.includes("feedback loop") ||
    (lower.includes("neural network") && (lower.includes("cycle proceeds") || lower.includes("iterative cycle") || lower.includes("training cycle") || lower.includes("repeats across thousands of batches"))) ||
    (lower.includes("cycle") && !isScientific && (lower.includes("repeats") || lower.includes("continuous")));

  const isHierarchy =
    lower.includes("hierarchy") ||
    lower.includes("pyramid") ||
    lower.includes("trophic level") ||
    lower.includes("levels of organization") ||
    lower.includes("levels of ecological") ||
    lower.includes("classification") ||
    (lower.includes("artificial intelligence") && lower.includes("machine learning") && lower.includes("deep learning"));

  const isProcess =
    !isComparison &&
    !isCycle &&
    (lower.includes("sdlc") ||
     lower.includes("software development life cycle") ||
     (lower.includes("handshake") && !lower.includes("udp")) ||
     lower.includes("compiler converts") ||
     lower.includes("compiler pipeline") ||
     lower.includes("step-by-step") ||
     lower.includes("workflow") ||
     lower.includes("pipeline") ||
     lower.includes("stages:") ||
     lower.includes("phases:") ||
     /\b(step|stage|phase)\s+[1-9]/i.test(cleanResponse) ||
     (lower.includes("first") && (lower.includes("then") || lower.includes("next") || lower.includes("finally"))) ||
     (lower.includes("process") && (lower.includes("design") || lower.includes("build") || lower.includes("test") || lower.includes("execute"))));

  const isData =
    numericData.length >= 2 &&
    (lower.includes("percent") || lower.includes("%") || lower.includes("statistics") || lower.includes("survey") || lower.includes("benchmark"));

  const isRadial =
    lower.includes("radial") ||
    lower.includes("hub and spoke") ||
    lower.includes("central hub") ||
    (lower.includes("radiating") && lower.includes("nodes"));

  let structureType = "mixed";
  if (isTimeline) structureType = "timeline";
  else if (isComparison) structureType = "comparison";
  else if (isHierarchy) structureType = "hierarchy";
  else if (isData) structureType = "data";
  else if (isScientific) structureType = "scientific";
  else if (isCycle) structureType = "cycle";
  else if (isProcess) structureType = "process";
  else if (isRadial) structureType = "radial";
  else structureType = "mixed";

  // 4. Extract Facts
  const facts = [];
  const sourceEvidence = [];
  const bulletLines = lines.filter((l) => /^[-*•\d+.)]\s+/.test(l));
  let candidateFacts = [];

  if (bulletLines.length >= 3) {
    candidateFacts = bulletLines.map((l) => l.replace(/^[-*•\d+.)]\s+/, ""));
  } else {
    const meaningfulSentences = sentences.filter(
      (s) => !/^(imagine\s+|suppose\s+|consider\s+|think of\s+|have you ever\s+|let's\s+|picture this\s+)/i.test(s)
    );
    candidateFacts = meaningfulSentences.length >= 3 ? meaningfulSentences : sentences;
  }

  candidateFacts.slice(0, 8).forEach((factStr) => {
    const trimmed = factStr.trim();
    if (trimmed.length > 10) {
      facts.push(trimmed);
      sourceEvidence.push({
        claim: trimmed.slice(0, 60),
        sourceSnippet: trimmed.slice(0, 120),
      });
    }
  });

  if (facts.length === 0) {
    facts.push(coreIdea);
    sourceEvidence.push({ claim: coreIdea, sourceSnippet: coreIdea });
  }

  // 5. Entities and Relationships
  const entities = [];
  const relationships = [];

  if (structureType === "comparison") {
    let subjectA = "Entity A";
    let subjectB = "Entity B";

    const qMatch = question ? question.match(/compare\s+([A-Za-z0-9\s/-]{2,30}?)\s+(?:and|with|to|vs\.?)\s+([A-Za-z0-9\s/-]{2,30}?)(?:\.|\?|$)/i) : null;
    if (qMatch && qMatch[1] && qMatch[2]) {
      subjectA = qMatch[1].trim();
      subjectB = qMatch[2].trim();
    } else {
      const vsMatch = cleanResponse.match(/([A-Za-z0-9\s/-]{2,25}?)\s+(?:vs\.?|versus|and|\/)\s+([A-Za-z0-9\s/-]{2,25}?)(?:\s+are|\s+differ|\b)/i);
      if (vsMatch && vsMatch[1] && vsMatch[2] && !/^(the|this|these|those)\b/i.test(vsMatch[1])) {
        subjectA = vsMatch[1].trim();
        subjectB = vsMatch[2].trim();
      } else if (lower.includes("compiler") && lower.includes("interpreter")) {
        subjectA = "Compiler";
        subjectB = "Interpreter";
      } else if (lower.includes("client") && lower.includes("server")) {
        subjectA = "Client (Initiator)";
        subjectB = "Server (Receiver)";
      } else if (lower.includes("tcp") && lower.includes("udp")) {
        subjectA = "TCP (Reliable Protocol)";
        subjectB = "UDP (Fast Datagram)";
      } else if (lower.includes("ram") && lower.includes("rom")) {
        subjectA = "RAM (Volatile Working Memory)";
        subjectB = "ROM (Non-Volatile Firmware)";
      } else if (lower.includes("supervised") && lower.includes("unsupervised")) {
        subjectA = "Supervised Learning";
        subjectB = "Unsupervised Learning";
      }
    }

    entities.push(
      { name: subjectA, role: "Primary Subject A", category: "Subject" },
      { name: subjectB, role: "Primary Subject B", category: "Subject" }
    );
    relationships.push({
      from: subjectA,
      to: subjectB,
      type: "contrasts_with",
      label: "Comparative Dimensions",
    });
  } else if (structureType === "scientific") {
    entities.push(
      { name: "Input Reagents / Stimuli", role: "Primary Energy & Source Matter", category: "Input" },
      { name: detectedTopic || "Core Reaction Engine", role: "Active Functional Center", category: "Process" },
      { name: "Synthesized Output", role: "Target Products & Stored Energy", category: "Output" }
    );
    relationships.push(
      { from: "Input Reagents / Stimuli", to: detectedTopic || "Core Reaction Engine", type: "powers", label: "Absorption" },
      { from: detectedTopic || "Core Reaction Engine", to: "Synthesized Output", type: "converts_to", label: "Synthesis" }
    );
  } else if (structureType === "process" || structureType === "cycle") {
    facts.forEach((f, idx) => {
      const colonMatch = f.match(/^([A-Za-z0-9\s/()-]{3,30}):\s*(.+)/);
      const stepName = colonMatch ? colonMatch[1].trim() : `Phase 0${idx + 1}`;
      entities.push({ name: stepName, role: f.slice(0, 45), category: "Stage" });
      if (idx > 0) {
        const prevColon = facts[idx - 1].match(/^([A-Za-z0-9\s/()-]{3,30}):/);
        const prevName = prevColon ? prevColon[1].trim() : `Phase 0${idx}`;
        relationships.push({
          from: prevName,
          to: stepName,
          type: "transitions_to",
          label: "next",
        });
      }
    });
    if (structureType === "cycle" && facts.length > 1) {
      relationships.push({
        from: entities[entities.length - 1]?.name || `Phase 0${facts.length}`,
        to: entities[0]?.name || "Phase 01",
        type: "cycles_back",
        label: "repeats",
      });
    }
  } else {
    const hubName = detectedTopic || "Central Concept";
    entities.push(
      { name: hubName, role: coreIdea.slice(0, 45), category: "Core" },
      ...facts.slice(0, 4).map((f, i) => {
        const colonMatch = f.match(/^([A-Za-z0-9\s/()-]{3,25}):/);
        return {
          name: colonMatch ? colonMatch[1].trim() : `Facet 0${i + 1}`,
          role: f.slice(0, 40),
          category: "Detail",
        };
      })
    );
    for (let i = 0; i < Math.min(facts.length, 4); i++) {
      relationships.push({
        from: hubName,
        to: entities[i + 1]?.name || `Facet 0${i + 1}`,
        type: "relates_to",
        label: i === 0 ? "defines" : i === 1 ? "executes" : i === 2 ? "regulates" : "delivers",
      });
    }
  }

  // 6. Caveats
  const caveats = [];
  if (lower.includes("however") || lower.includes("note that") || lower.includes("caveat") || lower.includes("limitation")) {
    const caveatMatch = cleanResponse.match(/(?:however|note that|warning|limitation|caution)[^.!?]+[.!?]/i);
    if (caveatMatch) caveats.push(caveatMatch[0].trim());
  }

  return {
    coreIdea,
    detectedTopic: detectedTopic || undefined,
    facts,
    entities,
    relationships,
    structureType,
    numericData: numericData.length > 0 ? numericData : undefined,
    caveats,
    sourceEvidence,
    metadata: {
      charCount: cleanResponse.length,
      wordCount: cleanResponse.split(/\s+/).length,
      questionContext: question,
    },
  };
}
