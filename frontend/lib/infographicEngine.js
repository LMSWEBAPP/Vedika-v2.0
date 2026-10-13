/**
 * Dynamic Infographic Engine
 * Analyzes Vedika responses and generates optimal Mermaid visualizations
 * Supports: flowchart, mindmap, timeline, graph, classDiagram, sequenceDiagram, quadrantChart, gitGraph
 */

// ─── Content Analysis ───

function analyzeContent(text) {
  const lower = text.toLowerCase();
  
  const signals = {
    // Process/Sequential indicators
    isProcess: /step \d|first|then|next|after|finally|phase \d|stage \d|workflow|pipeline|sequence|procedure|how to|process/i.test(text),
    
    // Hierarchy/Tree indicators
    isHierarchy: /hierarchy|tree|parent|child|root|branch|sub\-?category|taxonomy|classification|organization|org chart|reporting/i.test(text),
    
    // Comparison indicators
    isComparison: /vs|versus|compare|contrast|difference|similar|better|worse|pros|cons|advantage|disadvantage|trade.?off|alternative/i.test(text),
    
    // Timeline/Chronological indicators
    isTimeline: /timeline|history|evolution|chronological|year \d{4}|date|era|period|milestone|roadmap|journey|over time/i.test(text),
    
    // Mindmap/Concept indicators
    isMindmap: /concept|idea|brainstorm|related|associated|connected|theme|topic|mind.?map|central|radiate/i.test(text),
    
    // Decision/Flow indicators
    isDecision: /if|else|decision|condition|branch|choose|select|case|switch|logic|rule|criteria/i.test(text),
    
    // Data/Metrics indicators
    isData: /statistic|metric|percent|%|ratio|rate|growth|decline|trend|chart|graph|data|number|measure/i.test(text),
    
    // Relationship/Network indicators
    isNetwork: /relationship|connection|link|network|depend|impact|affect|influence|correlat|interact/i.test(text),
    
    // Architecture/System indicators
    isArchitecture: /architecture|system|component|module|service|api|database|server|client|infrastructure|deploy/i.test(text),
    
    // Learning/Educational indicators
    isEducational: /learn|understand|explain|concept|principle|theory|fundamental|basic|advanced|key.?point|takeaway/i.test(text)
  };
  
  // Count signal strengths
  const scores = {};
  for (const [key, regex] of Object.entries(signals)) {
    if (key === 'isData' || key === 'isEducational') continue; // These are modifiers, not primary types
    const matches = text.match(regex);
    scores[key] = matches ? matches.length : 0;
  }
  
  // Determine primary type
  let primaryType = 'flowchart'; // default
  let maxScore = 0;
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryType = type.replace('is', '').toLowerCase();
    }
  }
  
  // Special handling for combinations
  if (signals.isProcess && signals.isDecision) primaryType = 'flowchart';
  if (signals.isHierarchy && signals.isEducational) primaryType = 'mindmap';
  if (signals.isComparison && signals.isData) primaryType = 'quadrant';
  if (signals.isTimeline && signals.isProcess) primaryType = 'timeline';
  if (signals.isArchitecture && (signals.isProcess || signals.isHierarchy)) primaryType = 'architecture';
  
  return {
    primaryType,
    signals,
    confidence: maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3,
    wordCount: text.split(/\s+/).length,
    hasCodeBlocks: /```/.test(text),
    hasLists: /^[\s]*[-*•\d.]\s/m.test(text)
  };
}

// ─── Topic Extraction ───

function extractKeyPoints(text) {
  const points = [];
  
  // Extract from numbered lists
  const numbered = text.match(/^[\s]*\d+\.\s+(.+)$/gm);
  if (numbered) {
    points.push(...numbered.map(p => p.replace(/^[\s]*\d+\.\s+/, '').trim()));
  }
  
  // Extract from bullet points
  const bullets = text.match(/^[\s]*[-*•]\s+(.+)$/gm);
  if (bullets) {
    points.push(...bullets.map(p => p.replace(/^[\s]*[-*•]\s+/, '').trim()));
  }
  
  // Extract from bold text
  const bold = text.match(/\*\*([^*]+)\*\*/g);
  if (bold) {
    points.push(...bold.map(p => p.replace(/\*\*/g, '').trim()));
  }
  
  // Extract sentences with key verbs
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keySentences = sentences.filter(s => 
    /\b(is|are|has|have|contains|includes|consists|comprises|enables|allows|provides|creates|generates|transforms|converts|processes|manages|controls)\b/i.test(s)
  );
  points.push(...keySentences.slice(0, 5).map(s => s.trim()));
  
  // Deduplicate and limit
  return [...new Set(points)].slice(0, 8);
}

function extractEntities(text) {
  const entities = {
    actors: [],
    actions: [],
    objects: [],
    conditions: [],
    outcomes: []
  };
  
  // Simple pattern extraction
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const s = sentence.trim().toLowerCase();
    
    // Actors (who)
    const actorMatch = s.match(/(?:the|a|an)\s+(\w+(?:\s+\w+){0,2})\s+(?:is|are|does|performs|executes|runs|manages)/i);
    if (actorMatch) entities.actors.push(actorMatch[1]);
    
    // Actions (verbs)
    const actionMatches = s.match(/\b(creates?|generates?|processes?|transforms?|converts?|manages?|controls?|enables?|allows?|provides?|stores?|retrieves?|validates?|calculates?|computes?|executes?|runs?|handles?|manages?|coordinates?|orchestrates?)\b/gi);
    if (actionMatches) entities.actions.push(...actionMatches.map(a => a.toLowerCase()));
    
    // Objects (what)
    const objectMatch = s.match(/(?:creates?|generates?|processes?|transforms?|converts?|stores?|retrieves?|validates?)\s+(?:the|a|an)\s+(\w+(?:\s+\w+){0,2})/i);
    if (objectMatch) entities.objects.push(objectMatch[1]);
    
    // Conditions
    const condMatch = s.match(/\b(if|when|while|unless|provided|assuming)\s+(.+?)(?:,|then|$)/i);
    if (condMatch) entities.conditions.push(condMatch[2].trim());
    
    // Outcomes
    const outcomeMatch = s.match(/\b(then|resulting in|produces?|yields?|leads to|causes?)\s+(.+?)(?:,|\.|$)/i);
    if (outcomeMatch) entities.outcomes.push(outcomeMatch[2].trim());
  }
  
  // Deduplicate
  for (const key of Object.keys(entities)) {
    entities[key] = [...new Set(entities[key])].slice(0, 5);
  }
  
  return entities;
}

// ─── Diagram Type Definitions ───

const DIAGRAM_TYPES = {
  flowchart: {
    name: 'Flowchart',
    description: 'Process flows, decision trees, workflows',
    mermaidType: 'flowchart',
    bestFor: ['process', 'decision', 'workflow', 'procedure'],
    icon: '⟳',
    defaultDirection: 'TD'
  },
  mindmap: {
    name: 'Mindmap',
    description: 'Concepts radiating from central idea',
    mermaidType: 'mindmap',
    bestFor: ['concept', 'brainstorm', 'topic', 'educational'],
    icon: '🧠',
    defaultDirection: 'LR'
  },
  timeline: {
    name: 'Timeline',
    description: 'Chronological events, roadmaps, history',
    mermaidType: 'timeline',
    bestFor: ['history', 'evolution', 'roadmap', 'chronological'],
    icon: '📅',
    defaultDirection: 'LR'
  },
  graph: {
    name: 'Graph/Network',
    description: 'Relationships, dependencies, networks',
    mermaidType: 'graph',
    bestFor: ['relationship', 'network', 'dependency', 'connection'],
    icon: '🕸️',
    defaultDirection: 'LR'
  },
  classDiagram: {
    name: 'Class Diagram',
    description: 'Object-oriented structure, inheritance, interfaces',
    mermaidType: 'classDiagram',
    bestFor: ['architecture', 'system', 'class', 'interface', 'inheritance'],
    icon: '🏗️',
    defaultDirection: 'TD'
  },
  sequenceDiagram: {
    name: 'Sequence Diagram',
    description: 'Interactions over time between actors',
    mermaidType: 'sequenceDiagram',
    bestFor: ['interaction', 'api', 'protocol', 'communication', 'handshake'],
    icon: '↕️',
    defaultDirection: 'TD'
  },
  quadrantChart: {
    name: 'Quadrant Chart',
    description: 'Two-axis comparison (e.g., effort vs impact)',
    mermaidType: 'quadrantChart',
    bestFor: ['comparison', 'tradeoff', 'priority', 'matrix'],
    icon: '⬜',
    defaultDirection: 'TD'
  },
  gitGraph: {
    name: 'Git Graph',
    description: 'Branching, merging, version history',
    mermaidType: 'gitGraph',
    bestFor: ['branching', 'merge', 'version', 'workflow'],
    icon: '🌿',
    defaultDirection: 'TD'
  },
  pieChart: {
    name: 'Pie Chart',
    description: 'Proportions, distributions',
    mermaidType: 'pie',
    bestFor: ['distribution', 'proportion', 'percentage', 'share'],
    icon: '🥧',
    defaultDirection: 'TD'
  }
};

// ─── Dynamic Diagram Generators ───

function generateFlowchart(points, entities, analysis) {
  const hasDecision = analysis.signals.isDecision;
  const hasProcess = analysis.signals.isProcess;
  
  let chart = 'flowchart TD\n';
  
  if (points.length >= 3 && hasProcess) {
    // Multi-stage process
    const stages = Math.min(3, Math.ceil(points.length / 3));
    const perStage = Math.ceil(points.length / stages);
    
    for (let i = 0; i < stages; i++) {
      const stagePoints = points.slice(i * perStage, (i + 1) * perStage);
      const stageNum = i + 1;
      const icons = ['🌱', '⚙️', '🚀'];
      const labels = ['Foundation & Inputs', 'Core Process', 'Outputs & Outcomes'];
      
      chart += `  subgraph Stage${stageNum} ["${icons[i % 3]} Stage ${stageNum}: ${labels[i]}"]\n`;
      chart += `    direction LR\n`;
      
      stagePoints.forEach((pt, idx) => {
        const nodeId = `S${stageNum}_${idx + 1}`;
        const clean = sanitizeLabel(pt);
        const shape = hasDecision && idx % 2 === 1 ? '{{' : '[';
        const close = hasDecision && idx % 2 === 1 ? '}}' : ']';
        chart += `    ${nodeId}${shape}"<b>${clean.title}</b><br/><i>${clean.sub}</i>"${close}\n`;
      });
      
      if (stagePoints.length > 1) {
        chart += `    ${stagePoints.map((_, idx) => `S${stageNum}_${idx + 1}`).join(' ~~~ ')}\n`;
      }
      chart += `  end\n\n`;
    }
    
    // Connect stages
    for (let i = 0; i < stages - 1; i++) {
      chart += `  Stage${i + 1} ==>|"Flows to"| Stage${i + 2}\n`;
    }
  } else {
    // Simple linear or decision flow
    points.forEach((pt, idx) => {
      const nodeId = `Node${idx + 1}`;
      const clean = sanitizeLabel(pt);
      const isDecision = hasDecision && idx > 0 && idx < points.length - 1;
      const shape = isDecision ? '{{' : (idx === 0 || idx === points.length - 1 ? '(' : '[');
      const close = isDecision ? '}}' : (idx === 0 || idx === points.length - 1 ? ')' : ']');
      
      chart += `  ${nodeId}${shape}"<b>${clean.title}</b><br/><i>${clean.sub}</i>"${close}\n`;
    });
    
    for (let i = 0; i < points.length - 1; i++) {
      const arrow = i === points.length - 2 ? '==>' : '-->';
      chart += `  Node${i + 1} ${arrow} Node${i + 2}\n`;
    }
  }
  
  return chart;
}

function generateMindmap(points, entities, analysis) {
  // Central concept from first point or title
  const central = points[0] || 'Central Concept';
  const centralClean = sanitizeLabel(central);
  
  let chart = 'mindmap\n';
  chart += `  root(("${centralClean.title}"))\n`;
  
  // Group remaining points as branches
  const branches = points.slice(1);
  const branchGroups = groupPoints(branches, 3);
  
  branchGroups.forEach((group, gi) => {
    const groupIcon = ['📌', '💡', '🔗', '📊', '⚡'][gi % 5];
    const groupName = group[0] ? sanitizeLabel(group[0]).title : `Branch ${gi + 1}`;
    chart += `    ${groupIcon} ${groupName}\n`;
    
    group.slice(1).forEach((pt, pi) => {
      const clean = sanitizeLabel(pt);
      chart += `      ${clean.title}\n`;
    });
  });
  
  return chart;
}

function generateTimeline(points, entities, analysis) {
  let chart = 'timeline\n';
  chart += `  title Key Events & Milestones\n\n`;
  
  points.forEach((pt, idx) => {
    const clean = sanitizeLabel(pt);
    const year = extractYear(pt) || (2020 + idx);
    const period = idx === 0 ? 'Inception' : idx === points.length - 1 ? 'Current' : `Phase ${idx}`;
    chart += `  ${year} : ${period}\n`;
    chart += `    : ${clean.title}\n`;
    if (clean.sub) chart += `    : ${clean.sub}\n`;
    chart += '\n';
  });
  
  return chart;
}

function generateGraph(points, entities, analysis) {
  let chart = 'graph LR\n';
  
  // Create nodes
  points.forEach((pt, idx) => {
    const nodeId = `N${idx + 1}`;
    const clean = sanitizeLabel(pt);
    chart += `  ${nodeId}["<b>${clean.title}</b><br/><i>${clean.sub}</i>"]\n`;
  });
  
  // Create edges based on relationships
  if (entities.actors.length > 0 && entities.actions.length > 0) {
    // Actor -> Action -> Object pattern
    entities.actors.forEach((actor, ai) => {
      entities.actions.forEach((action, aci) => {
        entities.objects.forEach((obj, oi) => {
          chart += `  A${ai}["<b>${actor}</b>"] -->|${action}| AC${aci}["<b>${action}</b>"]\n`;
          chart += `  AC${aci} -->|acts on| O${oi}["<b>${obj}</b>"]\n`;
        });
      });
    });
  } else if (points.length >= 2) {
    // Connect sequentially with cross-links for network feel
    for (let i = 0; i < points.length - 1; i++) {
      chart += `  N${i + 1} --> N${i + 2}\n`;
    }
    // Add some cross connections
    if (points.length >= 4) {
      chart += `  N1 --> N3\n`;
      chart += `  N2 --> N4\n`;
    }
  }
  
  return chart;
}

function generateClassDiagram(points, entities, analysis) {
  let chart = 'classDiagram\n';
  let classNum = 0;
  
  // Create classes from key nouns/objects
  const classes = [...new Set([...entities.objects, ...points.slice(0, 5).map(p => sanitizeLabel(p).title)])];
  
  classes.forEach((cls, idx) => {
    const className = cls.replace(/\s+/g, '');
    chart += `  class ${className} {\n`;
    chart += `    +String name\n`;
    chart += `    +void process()\n`;
    chart += `  }\n\n`;
  });
  
  // Add relationships
  for (let i = 0; i < classes.length - 1; i++) {
    const rel = ['-->', '*--', '..>', '<|--'][i % 4];
    chart += `  ${classes[i].replace(/\s+/g, '')} ${rel} ${classes[i + 1].replace(/\s+/g, '')}\n`;
  }
  
  return chart;
}

function generateSequenceDiagram(points, entities, analysis) {
  let chart = 'sequenceDiagram\n';
  chart += `  autonumber\n`;
  
  const actors = entities.actors.length > 0 ? entities.actors : ['User', 'System'];
  actors.forEach((actor, idx) => {
    chart += `  participant ${actor.replace(/\s+/g, '')} as "${actor}"\n`;
  });
  chart += '\n';
  
  points.forEach((pt, idx) => {
    const clean = sanitizeLabel(pt);
    const actor = actors[idx % actors.length].replace(/\s+/g, '');
    chart += `  ${actor}->>${actor}: ${clean.title}\n`;
    if (clean.sub) chart += `  Note right of ${actor}: ${clean.sub}\n`;
  });
  
  return chart;
}

function generateQuadrantChart(points, entities, analysis) {
  let chart = 'quadrantChart\n';
  chart += `  title Priority Matrix\n\n`;
  
  // X-axis: Effort/Complexity, Y-axis: Impact/Value
  points.forEach((pt, idx) => {
    const clean = sanitizeLabel(pt);
    const effort = Math.floor(Math.random() * 50) + 25; // 25-75
    const impact = Math.floor(Math.random() * 50) + 25;
    chart += `  "${clean.title}" : [${effort}, ${impact}]\n`;
  });
  
  return chart;
}

function generatePieChart(points, entities, analysis) {
  let chart = 'pie showData\n';
  chart += `  title Distribution\n\n`;
  
  points.forEach((pt, idx) => {
    const clean = sanitizeLabel(pt);
    const value = Math.floor(Math.random() * 30) + 10; // 10-40
    chart += `  "${clean.title}" : ${value}\n`;
  });
  
  return chart;
}

function generateArchitectureDiagram(points, entities, analysis) {
  let chart = 'flowchart TD\n';
  
  // Layered architecture
  const layers = [
    { name: 'Presentation', icon: '🖥️', points: points.filter((_, i) => i % 3 === 0) },
    { name: 'Business Logic', icon: '⚙️', points: points.filter((_, i) => i % 3 === 1) },
    { name: 'Data Layer', icon: '🗄️', points: points.filter((_, i) => i % 3 === 2) }
  ].filter(l => l.points.length > 0);
  
  layers.forEach((layer, li) => {
    chart += `  subgraph Layer${li} ["${layer.icon} ${layer.name}"]\n`;
    chart += `    direction LR\n`;
    layer.points.forEach((pt, pi) => {
      const nodeId = `L${li}_${pi}`;
      const clean = sanitizeLabel(pt);
      chart += `    ${nodeId}["<b>${clean.title}</b><br/><i>${clean.sub}</i>"]\n`;
    });
    if (layer.points.length > 1) {
      chart += `    ${layer.points.map((_, pi) => `L${li}_${pi}`).join(' ~~~ ')}\n`;
    }
    chart += `  end\n\n`;
  });
  
  for (let i = 0; i < layers.length - 1; i++) {
    chart += `  Layer${i} --> Layer${i + 1}\n`;
  }
  
  return chart;
}

// ─── Helper Functions ───

function sanitizeLabel(text) {
  let clean = (text || '')
    .replace(/^[-*\d.)\s]+/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/["\(\)\[\]\{\}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  let match = clean.match(/^([^:]+?):\s*(.+)$/);
  if (!match) match = clean.match(/^([^—–]+?)\s*[—–]\s*(.+)$/);
  if (!match) match = clean.match(/^([^\-]+?)\s+-\s+(.+)$/);
  
  if (match && match[1].trim().length >= 2 && match[2].trim().length >= 2) {
    return { title: match[1].trim().slice(0, 36), sub: match[2].trim().slice(0, 65) };
  }
  return { title: clean.slice(0, 40), sub: clean.length > 40 ? clean.slice(40, 100) : '' };
}

function groupPoints(points, groupSize) {
  const groups = [];
  for (let i = 0; i < points.length; i += groupSize) {
    groups.push(points.slice(i, i + groupSize));
  }
  return groups;
}

function extractYear(text) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

// ─── Main Generator ───

export function generateInfographic(rawText, options = {}) {
  // Strip code blocks (e.g. ```mermaid ... ```) so code fences never contaminate extracted points
  const cleanedText = (rawText || '').replace(/```[\s\S]*?```/g, '').trim();
  const text = cleanedText.length > 20 ? cleanedText : (rawText || '');

  const analysis = analyzeContent(text);
  const points = extractKeyPoints(text);
  const entities = extractEntities(text);
  
  // Determine diagram type
  let diagramType = analysis.primaryType;
  
  // Override if explicitly requested
  if (options.type && DIAGRAM_TYPES[options.type]) {
    diagramType = options.type;
  }
  
  // Ensure we have enough points
  const effectivePoints = points.length > 0 ? points : [text.slice(0, 100)];
  
  // Generate diagram
  let mermaidCode;
  switch (diagramType) {
    case 'mindmap':
      mermaidCode = generateMindmap(effectivePoints, entities, analysis);
      break;
    case 'timeline':
      mermaidCode = generateTimeline(effectivePoints, entities, analysis);
      break;
    case 'graph':
      mermaidCode = generateGraph(effectivePoints, entities, analysis);
      break;
    case 'classDiagram':
      mermaidCode = generateClassDiagram(effectivePoints, entities, analysis);
      break;
    case 'sequenceDiagram':
      mermaidCode = generateSequenceDiagram(effectivePoints, entities, analysis);
      break;
    case 'quadrant':
    case 'quadrantChart':
      mermaidCode = generateQuadrantChart(effectivePoints, entities, analysis);
      break;
    case 'gitGraph':
      mermaidCode = generateGitGraph(effectivePoints, entities, analysis);
      break;
    case 'pie':
    case 'pieChart':
      mermaidCode = generatePieChart(effectivePoints, entities, analysis);
      break;
    case 'architecture':
      mermaidCode = generateArchitectureDiagram(effectivePoints, entities, analysis);
      break;
    case 'flowchart':
    default:
      mermaidCode = generateFlowchart(effectivePoints, entities, analysis);
      break;
  }
  
  // Generate key takeaways
  const takeaways = generateTakeaways(points, entities, analysis);
  
  return {
    mermaid: mermaidCode,
    points: takeaways,
    diagramType,
    analysis,
    meta: {
      confidence: analysis.confidence,
      wordCount: analysis.wordCount,
      pointCount: effectivePoints.length
    }
  };
}

function generateTakeaways(points, entities, analysis) {
  const takeaways = [];
  
  // Core concept
  if (points.length > 0) {
    takeaways.push(`**Core Concept**: ${sanitizeLabel(points[0]).title}`);
  }
  
  // Mechanism/Process
  if (analysis.signals.isProcess) {
    takeaways.push(`**Process**: ${points.slice(1, 3).map(p => sanitizeLabel(p).title).join(' → ')}`);
  }
  
  // Key relationships
  if (entities.actions.length > 0) {
    takeaways.push(`**Key Actions**: ${entities.actions.slice(0, 3).join(', ')}`);
  }
  
  // Actors/Components
  if (entities.objects.length > 0) {
    takeaways.push(`**Components**: ${entities.objects.slice(0, 3).join(', ')}`);
  }
  
  // Outcomes
  if (entities.outcomes.length > 0) {
    takeaways.push(`**Outcomes**: ${entities.outcomes.slice(0, 2).join(', ')}`);
  }
  
  // Fallback
  if (takeaways.length < 3) {
    points.slice(1, 4).forEach(p => {
      const clean = sanitizeLabel(p);
      if (clean.title) takeaways.push(`**${clean.title}**: ${clean.sub || 'Key aspect'}`);
    });
  }
  
  return takeaways.slice(0, 5);
}

// Export utilities
export { analyzeContent, extractKeyPoints, extractEntities, DIAGRAM_TYPES, sanitizeLabel };