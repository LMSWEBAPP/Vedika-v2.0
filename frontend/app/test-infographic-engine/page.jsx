'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { generateInfographic, analyzeContent, DIAGRAM_TYPES } from '@/lib/infographicEngine';

const MermaidDiagram = dynamic(() => import('@/components/MermaidDiagram'), { ssr: false });

const SAMPLES = {
  process: `Mitochondria are the powerhouses of the cell. The process begins with glycolysis where glucose is broken down into pyruvate in the cytoplasm. Pyruvate then enters the mitochondrial matrix where the citric acid cycle (Krebs cycle) occurs, producing NADH and FADH2. These electron carriers feed into the electron transport chain along the inner mitochondrial membrane. As electrons flow through complexes I-IV, protons are pumped into the intermembrane space creating a gradient. Finally, ATP synthase uses this proton gradient to phosphorylate ADP into ATP.`,
  
  decision: `When a cell receives a signal, it first checks if the receptor is activated. If the signal is strong enough, the cell initiates the MAPK pathway. If the signal is weak, it may trigger apoptosis instead. The decision depends on the phosphorylation state of key proteins. Once the pathway is chosen, downstream effectors are activated leading to either cell proliferation or programmed cell death.`,
  
  hierarchy: `The cardiovascular system consists of the heart, blood vessels, and blood. The heart has four chambers: two atria and two ventricles. Blood vessels are classified into arteries, veins, and capillaries. Arteries carry oxygenated blood away from the heart (except pulmonary artery). Veins return deoxygenated blood to the heart (except pulmonary vein). Capillaries are the site of gas exchange. Blood contains red blood cells, white blood cells, platelets, and plasma.`,
  
  timeline: `Earth formed 4.5 billion years ago. The first single-celled life appeared around 3.8 billion years ago. Photosynthesis evolved 2.5 billion years ago, oxygenating the atmosphere. The Cambrian explosion 541 million years ago saw rapid diversification. Dinosaurs dominated from 245 to 66 million years ago. Mammals rose after the K-T extinction. Humans evolved around 300,000 years ago.`,
  
  comparison: `Photosynthesis vs Cellular Respiration. Photosynthesis occurs in chloroplasts, uses CO2 and H2O, produces glucose and O2, requires light energy. Cellular respiration occurs in mitochondria, uses glucose and O2, produces CO2 and H2O, releases ATP energy. They are complementary processes - the products of one are the reactants of the other. Both involve electron transport chains and ATP synthesis.`,
  
  architecture: `A modern web application follows a layered architecture. The presentation layer handles UI rendering with React/Vue, state management with Redux, and API communication. The business logic layer contains services, controllers, validation, and domain models. The data layer uses ORM like Prisma, database connections, migrations, and caching with Redis. Infrastructure includes load balancers, containers, CI/CD pipelines, and monitoring.`,
  
  sequence: `The TCP three-way handshake establishes a reliable connection. Step 1: Client sends SYN with initial sequence number. Step 2: Server responds with SYN-ACK acknowledging client's sequence and sending its own. Step 3: Client sends ACK confirming server's sequence. Both sides now have synchronized sequence numbers and can exchange data reliably.`,
  
  mindmap: `Cellular respiration is the central concept. It branches into three main stages: Glycolysis in the cytoplasm, Citric Acid Cycle in the mitochondrial matrix, and Electron Transport Chain on the inner membrane. Glycolysis produces pyruvate and NADH. The Citric Acid Cycle generates NADH, FADH2, and GTP. The Electron Transport Chain creates a proton gradient driving ATP synthase. Key molecules: glucose, oxygen, ATP, NAD+, FAD.`
};

export default function InfographicEngineTest() {
  const [inputText, setInputText] = useState(SAMPLES.process);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeSample, setActiveSample] = useState('process');

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    
    addLog('Analyzing content...');
    const analysis = analyzeContent(inputText);
    addLog(`Detected type: ${analysis.primaryType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`);
    addLog(`Signals: ${Object.entries(analysis.signals).filter(([_,v]) => v).map(([k]) => k).join(', ')}`);
    
    addLog('Generating infographic...');
    const generated = generateInfographic(inputText);
    addLog(`Generated: ${generated.diagramType} diagram with ${generated.points.length} takeaways`);
    
    setResult(generated);
  };

  const loadSample = (key) => {
    setInputText(SAMPLES[key] || '');
    setActiveSample(key);
    setResult(null);
    setLogs([]);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setLogs([]);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1600, margin: '0 auto' }}>
      <h1 style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #38BDF8 0%, #A855F7 100%)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent',
        marginBottom: 30
      }}>
        🧠 Dynamic Infographic Engine Test
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left Panel */}
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.8)', 
          border: '1px solid rgba(56, 189, 248, 0.2)', 
          borderRadius: 12, 
          padding: 20 
        }}>
          <h3 style={{ color: '#38BDF8', marginTop: 0 }}>📝 Input Text</h3>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.keys(SAMPLES).map(key => (
              <button
                key={key}
                onClick={() => loadSample(key)}
                style={{
                  background: activeSample === key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: activeSample === key ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  color: activeSample === key ? '#38BDF8' : '#94A3B8',
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste Vedika response here..."
            style={{
              width: '100%',
              minHeight: 200,
              background: '#070913',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: 12,
              color: '#E2E8F0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerate}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
                color: '#030712',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✨ Generate Infographic
            </button>
            <button
              onClick={handleClear}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>

          <div style={{ 
            marginTop: 10, 
            background: '#050811', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 8, 
            padding: 16, 
            fontFamily: 'JetBrains Mono, monospace', 
            fontSize: 11, 
            color: '#94A3B8', 
            maxHeight: 200, 
            overflow: 'auto' 
          }}>
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.8)', 
          border: '1px solid rgba(56, 189, 248, 0.2)', 
          borderRadius: 12, 
          padding: 20,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ color: '#38BDF8', marginTop: 0 }}>📊 Generated Output</h3>
          
          {result ? (
            <>
              <div style={{
                display: 'inline-block',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16
              }}>
                {DIAGRAM_TYPES[result.diagramType]?.icon || '📊'} {DIAGRAM_TYPES[result.diagramType]?.name || result.diagramType}
              </div>
              
              <div style={{ flex: 1, minHeight: 400, marginBottom: 20 }}>
                <MermaidDiagram 
                  chart={result.mermaid} 
                  points={result.points} 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
                {result.points.map((pt, i) => (
                  <div key={i} style={{
                    background: 'rgba(245, 169, 91, 0.1)',
                    border: '1px solid rgba(245, 169, 91, 0.3)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 13
                  }}>
                    <strong style={{ color: '#F5A95B' }}>{i + 1}.</strong> {pt}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748B',
              fontSize: 16
            }}>
              Generate an infographic to see the result
            </div>
          )}
        </div>
      </div>
    </div>
  );
}