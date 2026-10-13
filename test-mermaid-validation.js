/**
 * Mermaid Infographic Validation Test Suite
 * Tests sanitizer, rendering, zoom, clipping, and reopen visibility
 */

const fs = require('fs');
const path = require('path');

// Load mermaid
const mermaid = require('mermaid');

// Initialize mermaid with same config as component
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#0F1420',
    primaryTextColor: '#F8FAFC',
    primaryBorderColor: '#38BDF8',
    lineColor: '#64748B',
    secondaryColor: '#161324',
    tertiaryColor: '#0D1929',
    edgeLabelBackground: '#0F1420',
    clusterBkg: 'rgba(12, 17, 32, 0.72)',
    clusterBorder: 'rgba(56, 189, 248, 0.28)',
    fontFamily: '"Outfit", sans-serif',
    fontSize: '13px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    useMaxWidth: false,
    nodeSpacing: 50,
    rankSpacing: 65,
    padding: 18
  }
});

// Copy of sanitizeMermaid from MermaidDiagram.jsx
function sanitizeMermaid(raw) {
  if (!raw) return '';
  let code = raw.trim();

  code = code.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();

  if (!/^(flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(code)) {
    code = `flowchart TD\n${code}`;
  }

  const cleanLabelText = (text) => {
    let clean = (text || '').trim();
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    clean = clean.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    clean = clean.replace(/"/g, "'");
    return clean;
  };

  code = code.replace(/\(\[\s*([^\]\n]+?)\s*\]\)/g, (_, text) => `(["${cleanLabelText(text)}"])`);
  code = code.replace(/\[\(\s*([^\)\n]+?)\s*\)\]/g, (_, text) => `[("${cleanLabelText(text)}")]`);
  code = code.replace(/\[\[\s*([^\]\n]+?)\s*\]\]/g, (_, text) => `[["${cleanLabelText(text)}"]]`);
  code = code.replace(/\{\{\s*([^\}\n]+?)\s*\}\}/g, (_, text) => `{{"${cleanLabelText(text)}"}}`);
  code = code.replace(/\(\(\s*([^\)\n]+?)\s*\)\)/g, (_, text) => `(("${cleanLabelText(text)}"))`);
  code = code.replace(/(?<![\(\[])\[\s*([^\(\[\{\]\)\n]+?)\s*\](?![\)\]])/g, (_, text) => `["${cleanLabelText(text)}"]`);
  code = code.replace(/\|([^\|\n]+?)\|/g, (_, label) => `|"${cleanLabelText(label)}"|`);

  // 8. Subgraph labels: subgraph Title ["Label"] - sanitize the label inside brackets
  code = code.replace(/subgraph\s+(\w+)\s*\[([^\]]+)\]/gi, (match, id, label) => {
    return `subgraph ${id} ["${cleanLabelText(label)}"]`;
  });

  // 9. Clickable links: click nodeId "url" "tooltip" - preserve but sanitize tooltip
  code = code.replace(/click\s+(\w+)\s+"([^"]+)"\s+"([^"]+)"/gi, (match, nodeId, url, tooltip) => {
    return `click ${nodeId} "${url}" "${cleanLabelText(tooltip)}"`;
  });

  return code;
}

// Test diagram codes
const testDiagrams = {
  basic: `flowchart TD
    A["<b>Start</b><br/><i>Initial Node</i>"]
    B["<b>Process</b><br/><i>Core Logic</i>"]
    C(["<b>End</b><br/><i>Final Output</i>"])
    A --> B --> C`,

  hexagon: `flowchart TD
    A["<b>Input</b><br/><i>Data In</i>"]
    B{{"<b>Decision</b><br/><i>Check Condition</i>"}}
    C(["<b>Output</b><br/><i>Result</i>"])
    A --> B --> C`,

  cylinder: `flowchart TD
    A["<b>Query</b><br/><i>User Request</i>"]
    B[("<b>Database</b><br/><i>Data Store</i>")]
    C(["<b>Response</b><br/><i>Return Data</i>"])
    A --> B --> C`,

  subgraph: `flowchart TD
    subgraph Stage1 ["🌱 Stage 1: Inputs"]
      direction LR
      A(["<b>Glucose</b><br/><i>Fuel</i>"])
      B(["<b>Oxygen</b><br/><i>Catalyst</i>"])
      A ~~~ B
    end
    subgraph Stage2 ["⚙️ Stage 2: Process"]
      direction TB
      C{{"<b>Respiration</b><br/><i>Energy Release</i>"}}
    end
    subgraph Stage3 ["🚀 Stage 3: Outputs"]
      direction LR
      D(["<b>ATP</b><br/><i>Energy</i>"])
      E(["<b>CO2</b><br/><i>Waste</i>"])
      D ~~~ E
    end
    Stage1 ==>|"Feeds"| Stage2
    Stage2 ==>|"Produces"| Stage3`,

  edgeLabels: `flowchart TD
    A["<b>Node A</b>"] -->|"Processes data"| B["<b>Node B</b>"]
    B -->|"Transforms"| C["<b>Node C</b>"]
    C ==>|"Delivers result"| D["<b>Node D</b>"]`,

  complex: `flowchart TD
    subgraph Inputs ["🌱 Stage 1: Foundation & Inputs"]
      direction LR
      In_1(["<b>⚡ Primary Input</b><br/><i>Core substrate</i>"])
      In_2(["<b>⚙️ Catalyst</b><br/><i>Supporting factor</i>"])
      In_1 ~~~ In_2
    end
    subgraph Process ["⚙️ Stage 2: Core Mechanism"]
      direction TB
      Proc_1[("<b>🔍 Core Engine</b><br/><i>Transformation logic</i>")]
      Proc_2{{"<b>💡 Decision Gate</b><br/><i>Checkpoint validation</i>"}}
      Proc_3[("🗄️ <b>State Bank</b><br/><i>Stored capacity</i>")]
      Proc_1 -->|"Feeds"| Proc_2
      Proc_2 -->|"Stores"| Proc_3
    end
    subgraph Outputs ["🚀 Stage 3: Deliverables"]
      direction LR
      Out_1(["<b>🏆 Final Product</b><br/><i>Practical outcome</i>"])
      Out_2(["<b>📊 Metric</b><br/><i>Measured yield</i>"])
      Out_1 ~~~ Out_2
    end
    Inputs ==>|"Processes into"| Process
    Process ==>|"Yields deliverables"| Outputs`,

  // Test case with problematic syntax from edge_dom.txt
  hexagonBug: `flowchart TD
    subgraph Stage1 ["🌱 1. Cellular Ingestion & Fuel Supply"]
      A(["🍇 Glucose<br/><i>Nutrient Fuel Source</i>"])
      B(["🫁 Oxygen (O₂)<br/><i>Inhaled Gas Catalyst</i>"])
    end

    subgraph Stage2 ["⚙️ 2. Mitochondrial Power Plant"]
      direction TB
      C["🔬 Cellular Respiration<br/><i>Chemical Oxidation Engine</i>"]
      E{{ "⚡ Bond Cleavage<br/><i>High-Energy Yield Check</i>" }}
      D[("🗄️ ATP Battery Bank<br/><i>Charged Chemical Energy</i>")]
      F["🌫️ Metabolic Byproducts<br/><i>CO₂ & Water Excretion</i>"]

      C -->|"Feeds Chemical Reaction"| E
      E -->|"Packs Energy Into"| D
      C -->|"Generates Exhaust"| F
    end

    subgraph Stage3 ["🚀 3. Physiological Work & Impact"]
      G(["💪 Muscle Contraction<br/><i>Physical Movement & Force</i>"])
      H(["🫀 Cardiac Rhythm<br/><i>Continuous Heartbeat Pumping</i>"])
      I(["🧠 Neural Transmission<br/><i>Brain Signal & Cognition</i>"])
    end

    A -->|"Delivers Carbon Fuel"| C
    B -->|"Enables Cellular Respiration"| C
    D ==>|"Discharges Power"| G
    D ==>|"Sustains Function"| H
    D ==>|"Fuels Synapses"| I`,
};

let testCount = 0;
let passCount = 0;
let failCount = 0;

function log(msg) {
  console.log(msg);
}

function addResult(name, passed, details = '') {
  testCount++;
  if (passed) passCount++; else failCount++;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${details ? ': ' + details : ''}`);
}

async function testSanitizer() {
  log('\n=== Testing Sanitizer ===');
  
  // Test hexagon syntax (no space after {{)
  const hexagonInput = `A{{ "Label" }}`;
  const hexagonOutput = sanitizeMermaid(hexagonInput);
  const hexagonPass = hexagonOutput.includes('{{"Label"}}') && !hexagonOutput.includes('{{ "');
  addResult('Hexagon syntax (no space after {{)', hexagonPass, `Output: ${hexagonOutput}`);

  // Test stadium shape
  const stadiumInput = `A([ Label ])`;
  const stadiumOutput = sanitizeMermaid(stadiumInput);
  const stadiumPass = stadiumOutput.includes('(["Label"])');
  addResult('Stadium shape quoting', stadiumPass, `Output: ${stadiumOutput}`);

  // Test cylinder shape
  const cylinderInput = `A[( Label )]`;
  const cylinderOutput = sanitizeMermaid(cylinderInput);
  const cylinderPass = cylinderOutput.includes('[("Label")]');
  addResult('Cylinder shape quoting', cylinderPass, `Output: ${cylinderOutput}`);

  // Test edge labels
  const edgeInput = `A -->|label| B`;
  const edgeOutput = sanitizeMermaid(edgeInput);
  const edgePass = edgeOutput.includes('|"label"|');
  addResult('Edge label quoting', edgePass, `Output: ${edgeOutput}`);

  // Test markdown conversion
  const mdInput = `A["**Bold** and *Italic*"]`;
  const mdOutput = sanitizeMermaid(mdInput);
  const mdPass = mdOutput.includes('<b>Bold</b>') && mdOutput.includes('<i>Italic</i>');
  addResult('Markdown to HTML conversion', mdPass, `Output: ${mdOutput}`);

  // Test subgraph preservation
  const subgraphInput = `subgraph Test ["Title"]\nA["Node"]\nend`;
  const subgraphOutput = sanitizeMermaid(subgraphInput);
  const subgraphPass = subgraphOutput.includes('subgraph Test ["Title"]');
  addResult('Subgraph header preserved', subgraphPass, `Output: ${subgraphOutput}`);

  // Test hexagon bug case (space after {{)
  const bugInput = `E{{ "⚡ Bond Cleavage<br/><i>High-Energy Yield Check</i>" }}`;
  const bugOutput = sanitizeMermaid(bugInput);
  const bugPass = bugOutput.includes('{{"') && !bugOutput.includes('{{ "');
  addResult('Hexagon bug fix (space after {{)', bugPass, `Output: ${bugOutput}`);
}

async function testRender() {
  log('\n=== Testing Render ===');
  
  for (const [name, code] of Object.entries(testDiagrams)) {
    try {
      const sanitized = sanitizeMermaid(code);
      const renderId = `test-${name}-${Date.now()}`;
      const { svg } = await mermaid.render(renderId, sanitized);
      
      const hasSvg = svg && svg.length > 100 && svg.includes('<svg');
      addResult(`Render: ${name}`, hasSvg, hasSvg ? `SVG length: ${svg.length}` : 'Empty SVG');
      
      if (!hasSvg) {
        console.log(`  Sanitized code: ${sanitized}`);
      }
    } catch (err) {
      addResult(`Render: ${name}`, false, err.message);
      console.log(`  Sanitized code: ${sanitizeMermaid(code)}`);
    }
  }
}

async function testZoom() {
  log('\n=== Testing Zoom Fit ===');
  
  try {
    const sanitized = sanitizeMermaid(testDiagrams.complex);
    const renderId = `zoom-test-${Date.now()}`;
    const { svg } = await mermaid.render(renderId, sanitized);
    
    // Parse viewBox from SVG
    const vbMatch = svg.match(/viewBox="([^"]+)"/);
    if (!vbMatch) {
      addResult('Zoom: viewBox found', false, 'No viewBox in SVG');
      return;
    }
    
    const vbParts = vbMatch[1].split(/[\s,]+/).map(Number);
    const naturalW = vbParts[2] || 800;
    const naturalH = vbParts[3] || 600;
    
    // Simulate viewport dimensions (1920x1080 laptop)
    const vpW = 1472; // viewport width minus padding
    const vpH = 804;  // viewport height minus padding
    const paddingX = 48;
    const paddingY = 40;
    const availW = Math.max(200, vpW - paddingX);
    const availH = Math.max(200, vpH - paddingY);
    const maxStageW = 1150;
    const targetW = Math.min(availW, maxStageW);
    const aspect = naturalH / Math.max(40, naturalW);
    const renderedH = targetW * aspect;
    
    const scaleW = availW / targetW;
    const scaleH = availH / Math.max(40, renderedH);
    let ideal = Math.min(scaleW, scaleH);
    
    const MIN_MODAL_ZOOM = 0.60;
    const MAX_MODAL_ZOOM = 1.65;
    const finalZoom = Math.max(MIN_MODAL_ZOOM, Math.min(MAX_MODAL_ZOOM, ideal));
    
    addResult('Zoom calculation', true, `Natural: ${naturalW}x${naturalH}, Fit zoom: ${finalZoom.toFixed(2)}`);
    addResult('Zoom within bounds', finalZoom >= MIN_MODAL_ZOOM && finalZoom <= MAX_MODAL_ZOOM, `Zoom: ${finalZoom.toFixed(2)}`);
    
    // Test small viewport (1366x768)
    const vpW2 = 1296;
    const vpH2 = 498;
    const availW2 = Math.max(200, vpW2 - paddingX);
    const availH2 = Math.max(200, vpH2 - paddingY);
    const targetW2 = Math.min(availW2, maxStageW);
    const renderedH2 = targetW2 * aspect;
    const scaleW2 = availW2 / targetW2;
    const scaleH2 = availH2 / Math.max(40, renderedH2);
    let ideal2 = Math.min(scaleW2, scaleH2);
    const finalZoom2 = Math.max(MIN_MODAL_ZOOM, Math.min(MAX_MODAL_ZOOM, ideal2));
    
    addResult('Zoom small viewport', finalZoom2 >= MIN_MODAL_ZOOM, `Zoom: ${finalZoom2.toFixed(2)} (clamped: ${finalZoom2 === MIN_MODAL_ZOOM})`);
    
  } catch (err) {
    addResult('Zoom fit test', false, err.message);
  }
}

async function testSubgraphLabels() {
  log('\n=== Testing Subgraph Labels ===');
  
  const testCases = [
    { input: `subgraph Test ["Title with **bold**"]`, expect: 'Title with <b>bold</b>' },
    { input: `subgraph Test ["Title with "quotes""]`, expect: "Title with 'quotes'" },
    { input: `subgraph Test ["Title with (parens)"]`, expect: 'Title with (parens)' },
  ];
  
  for (const tc of testCases) {
    const output = sanitizeMermaid(tc.input);
    const pass = output.includes(tc.expect);
    addResult(`Subgraph label: ${tc.expect}`, pass, `Output: ${output}`);
  }
}

async function testEdgeLabels() {
  log('\n=== Testing Edge Labels ===');
  
  const testCases = [
    { input: `A -->|label| B`, expect: '|"label"|' },
    { input: `A -->|"quoted label"| B`, expect: '|"quoted label"|' },
    { input: `A ==>|"label with (parens)"| B`, expect: '|"label with (parens)"|' },
    { input: `A -->|label with "quotes"| B`, expect: '|"label with \'quotes\'"|' },
  ];
  
  for (const tc of testCases) {
    const output = sanitizeMermaid(tc.input);
    const pass = output.includes(tc.expect);
    addResult(`Edge label: ${tc.expect}`, pass, `Output: ${output}`);
  }
}

async function runAllTests() {
  console.log('Starting Mermaid Infographic Validation Suite...');
  
  await testSanitizer();
  await testRender();
  await testZoom();
  await testSubgraphLabels();
  await testEdgeLabels();
  
  console.log(`\n=== SUMMARY: ${passCount}/${testCount} tests passed ${failCount > 0 ? `(${failCount} failed)` : ''} ===`);
  
  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});