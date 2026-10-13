async function testInfographic() {
  const system = `You are a world-class visual knowledge architect, information designer, and creative diagram specialist.
Your mission is to transform educational concepts into rich, visually engaging, 16:9 widescreen 2D Mermaid.js infographics accompanied by structured key takeaway bullet points.

CREATIVE DESIGN PRINCIPLES (WIDE 16:9 BALANCED LANDSCAPE):
1. SPATIAL BALANCE & 16:9 WIDESCREEN TOPOLOGY:
   - NEVER generate a narrow, 1-dimensional vertical tower (stacking nodes one below another). Such tall columns waste screen space and force tedious vertical scrolling!
   - ALWAYS design a WIDE, multi-tier horizontal architecture using 'flowchart TD' where EVERY stage spreads horizontally:
     * Stage 1 (Inputs & Pre-Conditions): MUST include 'direction LR' with 2 to 3 inputs/catalysts placed side-by-side (using 'In_1 ~~~ In_2' invisible links).
     * Stage 2 (Core Mechanism & Transformation): MUST arrange core structures and reactions horizontally side-by-side using 'direction LR' or parallel branches (e.g. 'Proc_1 ~~~ Proc_2' or two parallel inputs feeding into a central checkpoint).
     * Stage 3 (Deliverables & Everyday Work): MUST include 'direction LR' with 2 to 3 practical outcomes placed side-by-side (using 'Out_1 ~~~ Out_2' invisible links).
   - The overall diagram MUST be wider than it is tall (approximate 16:9 or 4:3 landscape ratio), occupying the broad width of laptop screens comfortably.
   - Connect stages using prominent conduit arrows ('==>' or '-->') with descriptive transition labels.

2. DIVERSE SEMANTIC ARCHITECTURAL SHAPES:
   - Use varied shape semantics:
     * Stadium pills \`(["⚡ Catalyst / Input / Result"])\` for starting triggers and final practical outcomes.
     * Cards \`["⚙️ Core Component / Organelle"]\` for primary physical structures or engines.
     * Hexagons \`{{"🔥 Chemical Reaction / Checkpoint"}}\` (strictly NO internal spaces after {{) for reactions, conditions, or branches.
     * Cylinders \`[("🔋 Energy Storage / Reserve / ATP")]\` for energy banks, databases, state, or rechargeable batteries.
     * Circles \`(("🎯 Milestone"))\` for key junctions.

3. DESCRIPTIVE CONNECTOR LABELS:
   - Make flow arrows tell a story with labels:
     e.g. Stage1 ==>|"Processes Substrates"| Stage2
     e.g. Stage2 ==>|"Yields Deliverables"| Stage3

4. VISUAL HIERARCHY & METRIC BADGES:
   - Prefix every node label with a relevant emoji icon (🎯, ⚡, 🛡️, ⚙️, 🚀, 💡, 📊, 🗄️, 🧠, 🔍, 🧬, 🌿, 🔬, 🔋, 🫁, 🍇, ❤️, 💪).
   - Use multi-line text with subtitle details inside nodes using \`<br/><i>...</i>\` to add depth.
     e.g. Node1["🍇 <b>Glucose</b><br/><i>simple sugar • main fuel</i>"]

OUTPUT FORMAT REQUIREMENTS:
1. Wrap the Mermaid code in a \`\`\`mermaid ... \`\`\` block.
2. Directly beneath, write "Key Takeaways:" followed by 4 to 5 clear bullet points starting with "- **Concept**: Detailed takeaway".

STRICT SYNTAX RULES:
- ALWAYS enclose node label text in double quotes: NodeId["Label text"].
- Inside double-quoted labels, do NOT use unescaped double quotes.
- Do NOT use raw markdown formatting (**bold**, \`code\`) inside node labels; use <b> and <i> tags instead.
- For hexagon shapes, strictly use \`Id{{"Label"}}\` with NO space between {{ and the opening quote.
- Output ONLY the mermaid code block and key takeaways. No conversational preamble.`;

  const user = `Based on the following explanation, generate a rich, multi-tiered Mermaid.js infographic diagram and 4-5 high-impact takeaway bullet points.
Create a structured, balanced 2D layout using 'flowchart TD' with 3 logical grouping stages (\`subgraph\` containers):
- Stage 1 (Inputs & Foundation): use 'direction LR' for horizontal side-by-side elements.
- Stage 2 (Core Mechanism & Engine): use 'direction TB' for vertical transformation flow with varied semantic shapes (cards, hexagons for checkpoints/reactions, cylinders for storage/reserves).
- Stage 3 (Deliverables & Impact): use 'direction LR' for horizontal side-by-side deliverables.
Connect the stages with thick descriptive conduit arrows (e.g. ==>|"Conduit"|).

STRICT SYNTAX:
- For hexagon shapes, strictly use \`Id{{"Label"}}\` with NO space between {{ and the opening quote.
- Every node text label MUST be enclosed in double quotes like Node["Label"].
- Use <b> and <i> tags with <br/> for subheadings. Do NOT use markdown asterisks (**) inside node labels.
- Prefix node labels with contextual emoji icons (⚡, ⚙️, 🔋, 🏆, etc.).

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:
\`\`\`mermaid
flowchart TD
  subgraph Phase1 ["🌱 1. Intake & Foundation"]
    direction LR
    A(["🎯 Core Ingest<br/><i>primary input</i>"])
    B["⚙️ Auxiliary Catalyst<br/><i>supporting factor</i>"]
    A ~~~ B
  end
  subgraph Phase2 ["⚙️ 2. Transformation Engine"]
    direction TB
    C["⚡ Core Processing Engine<br/><i>structural mechanism</i>"]
    D{{"❓ Decision Checkpoint<br/><i>transformation stage</i>"}}
    E[("🗄️ State Bank / Memory<br/><i>stored capacity</i>")]
    C -->|"Executes"| D
    D -->|"Stores"| E
  end
  subgraph Phase3 ["🚀 3. Deliverables & Impacts"]
    direction LR
    F(["🏆 Final Deliverable<br/><i>practical outcome</i>"])
    G["📊 Performance Metric<br/><i>measured yield</i>"]
    F ~~~ G
  end
  Phase1 ==>|"Intake Flow"| Phase2
  Phase2 ==>|"Yield Transfer"| Phase3
\`\`\`

Key Takeaways:
- **Core Concept**: Clear summary point
- **Mechanism**: How it operates
- **Application**: Practical takeaway

Explanation:
An antenna is a piece of metal, like a rod or wire, that acts as a translator between electricity moving through a wire and invisible ripples of energy traveling through the air, called radio waves(a type of energy used to carry information through space). To send a message, a device pushes tiny, subatomic particles calledelectrons(the basic building blocks of electricity) back and forth inside the metal antenna extremely fast. This rapid vibrating movement of electrons creates invisible energy ripples that shoot out into the air in all directions, much like splashing your hand back and forth in a pool creates water waves that spread across the surface.

To receive a message, the process works in reverse. When those traveling energy ripples pass by a distant receiving antenna, they bump into the electrons inside that metal rod. The ripples force those electrons to vibrate back and forth at the exact same speed as the original wave. This movement creates anelectric current (a flow of moving electricity) inside the receiver's wire. A connected device, such as a cell phone or radio, then reads this new electric current and transforms it back into understandable information, like sound, video, or text.`;

  try {
    const response = await fetch('http://localhost:3011/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system,
        user,
        maxOutputTokens: 3000,
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testInfographic();