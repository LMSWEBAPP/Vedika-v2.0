'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

const DEFAULT_WAVE_CONFIG = {
  wave1: {
    top: -6,
    left: -18,
    width: 120,
    height: 65,
    rot: -23,
    scale: 0.95,
    blur: 1.9,
    opacity: 0.7,
  },
  wave2: {
    bottom: 33,
    right: -38,
    width: 140,
    height: 140,
    rot: -27,
    scale: 0.5,
    blur: 3.8,
    opacity: 0.45,
  },
  global: {
    speedMult: 1.1,
    sway: 2,
  },
};

export default function WavyLinesBackground({ opacity = 1.0, className = '' }) {
  const containerRef = useRef(null);

  const [waveConfig, setWaveConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vedika_wavy_bg_config_v5');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            wave1: { ...DEFAULT_WAVE_CONFIG.wave1, ...parsed.wave1 },
            wave2: { ...DEFAULT_WAVE_CONFIG.wave2, ...parsed.wave2 },
            global: { ...DEFAULT_WAVE_CONFIG.global, ...parsed.global },
          };
        }
      } catch (e) {}
    }
    return DEFAULT_WAVE_CONFIG;
  });

  const [showTuner, setShowTuner] = useState(false);
  const [activeTab, setActiveTab] = useState('wave1'); // 'wave1' | 'wave2' | 'global'
  const [copiedToast, setCopiedToast] = useState(false);

  // Dragging state for moveable studio dock
  const [dockPos, setDockPos] = useState({ x: 0, y: 72 });
  const [hasPositioned, setHasPositioned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasPositioned) {
      // Default to top-right corner so the bottom wave is 100% visible
      const initialX = Math.max(20, window.innerWidth - 410);
      const initialY = 72;
      setDockPos({ x: initialX, y: initialY });
      setHasPositioned(true);
    }
  }, [hasPositioned]);

  const handlePointerDown = (e) => {
    // Only drag from the header handle, don't hijack buttons or inputs
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - dockPos.x,
      y: e.clientY - dockPos.y,
    };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    const maxX = Math.max(10, window.innerWidth - 385);
    const maxY = Math.max(10, window.innerHeight - 120);
    setDockPos({
      x: Math.max(10, Math.min(maxX, newX)),
      y: Math.max(10, Math.min(maxY, newY)),
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (err) {}
  };

  const handleConfigChange = useCallback((section, key, value) => {
    setWaveConfig(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: Number(value)
        }
      };
      try {
        localStorage.setItem('vedika_wavy_bg_config_v5', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const copyConfigToClipboard = () => {
    const text = JSON.stringify(waveConfig, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    });
  };

  const resetConfig = () => {
    setWaveConfig(DEFAULT_WAVE_CONFIG);
    try {
      localStorage.setItem('vedika_wavy_bg_config_v5', JSON.stringify(DEFAULT_WAVE_CONFIG));
    } catch (e) {}
  };

  // GSAP stroke-dashoffset infinite continuous flow & organic sway
  useEffect(() => {
    if (!containerRef.current) return;
    const svgs = containerRef.current.querySelectorAll('.wavy-cluster-svg');
    if (!svgs || svgs.length === 0) return;

    const tweens = [];

    svgs.forEach((svg, svgIdx) => {
      const paths = svg.querySelectorAll('path');
      paths.forEach((p, i) => {
        const dashAttr = p.getAttribute('stroke-dasharray') || '16 4';
        const parts = dashAttr.trim().split(/\s+/).map(Number);
        const dash = parts[0] || 16;
        const gap = parts[1] || 4;
        const period = dash + gap;

        const multiplier = Math.max(10, Math.round(600 / period));
        const distance = period * multiplier;

        p.style.willChange = 'stroke-dashoffset';

        const baseDuration = (30 + (i % 8) * 1.8) / (waveConfig.global.speedMult || 1.0);

        gsap.set(p, { strokeDashoffset: 0 });

        const tw = gsap.to(p, {
          strokeDashoffset: -distance,
          duration: baseDuration,
          repeat: -1,
          ease: 'none',
        });
        tweens.push(tw);
      });

      const swayAmt = waveConfig.global.sway ?? 26;
      const swayTw = gsap.to(svg, {
        x: svgIdx === 0 ? swayAmt : -swayAmt,
        y: svgIdx === 0 ? -(swayAmt * 0.5) : (swayAmt * 0.5),
        duration: 16 + svgIdx * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      tweens.push(swayTw);
    });

    return () => {
      tweens.forEach(tw => tw.kill());
      svgs.forEach(svg => gsap.killTweensOf(svg));
    };
  }, [waveConfig.global.speedMult, waveConfig.global.sway]);

  return (
    <>
      {/* ── BACKGROUND CONTAINER (Absolute inset 0, pointer-events: none) ── */}
      <div
        ref={containerRef}
        className={'wavy-lines-bg ' + className}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: '#040711',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: opacity,
          transition: 'opacity 0.6s ease'
        }}
        aria-hidden="true"
      >
        {/* ── 1. TOP-LEFT DIAGONAL WAVE CLUSTER WRAPPER ── */}
        <div
          style={{
            position: 'absolute',
            top: `${waveConfig.wave1.top}vh`,
            left: `${waveConfig.wave1.left}vw`,
            width: `${waveConfig.wave1.width}vw`,
            minWidth: '2000px',
            height: `${waveConfig.wave1.height}vh`,
            opacity: waveConfig.wave1.opacity,
            transform: `rotate(${waveConfig.wave1.rot}deg) scale(${waveConfig.wave1.scale})`,
            transformOrigin: '0% 0%',
            filter: `blur(${waveConfig.wave1.blur}px)`,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 16%, black 84%, rgba(0,0,0,0.5) 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 16%, black 84%, rgba(0,0,0,0.5) 92%, transparent 100%)',
            transition: 'none',
          }}
        >
          <svg
            className="wavy-cluster-svg"
            viewBox="0 -75 922 230"
            preserveAspectRatio="xMidYMid slice"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <path d="M935.0,-32.2C922.2,-30.3,878.3,-20.6,865.0,-21.6C851.7,-22.6,801.9,-42.5,790.0,-43.0C778.1,-43.5,747.8,-26.7,735.0,-26.7C722.2,-26.7,664.2,-43.2,650.0,-42.7C635.8,-42.2,592.4,-21.4,580.0,-21.3C567.6,-21.1,527.4,-41.6,515.0,-41.0C502.6,-40.4,457.8,-16.1,445.0,-14.5C432.2,-12.9,388.8,-20.9,375.0,-23.3C361.2,-25.7,310.1,-41.1,295.0,-40.7C279.9,-40.3,224.2,-19.8,210.0,-18.7C195.8,-17.6,154.2,-28.6,140.0,-29.0C125.8,-29.4,69.2,-22.1,55.0,-22.5C40.8,-22.9,-2.2,-31.3,-15.0,-33.3" fill="none" stroke="#e8505b" strokeDasharray="8 5" strokeWidth="1.6"/>
            <path d="M935.0,-22.9C922.2,-21.0,878.3,-11.7,865.0,-12.8C851.7,-13.9,801.9,-34.3,790.0,-34.8C778.1,-35.2,747.8,-18.0,735.0,-18.0C722.2,-18.0,664.2,-35.3,650.0,-34.7C635.8,-34.2,592.4,-12.2,580.0,-12.0C567.6,-11.9,527.4,-33.3,515.0,-32.8C502.6,-32.2,457.8,-7.3,445.0,-5.6C432.2,-4.0,388.8,-12.3,375.0,-14.8C361.2,-17.3,310.1,-33.2,295.0,-32.7C279.9,-32.3,224.2,-11.1,210.0,-10.0C195.8,-8.9,154.2,-20.4,140.0,-20.8C125.8,-21.1,69.2,-13.2,55.0,-13.6C40.8,-14.0,-2.2,-22.7,-15.0,-24.8" fill="none" stroke="#f9d56e" strokeDasharray="23 2" strokeWidth="1.6"/>
            <path d="M935.0,-13.8C922.2,-12.1,878.3,-3.1,865.0,-4.3C851.7,-5.5,801.9,-26.3,790.0,-26.8C778.1,-27.3,747.8,-9.6,735.0,-9.6C722.2,-9.6,664.2,-27.6,650.0,-27.0C635.8,-26.4,592.4,-3.3,580.0,-3.1C567.6,-2.9,527.4,-25.4,515.0,-24.8C502.6,-24.2,457.8,1.3,445.0,3.0C432.2,4.6,388.8,-4.0,375.0,-6.6C361.2,-9.1,310.1,-25.5,295.0,-25.0C279.9,-24.6,224.2,-2.7,210.0,-1.6C195.8,-0.5,154.2,-12.5,140.0,-12.8C125.8,-13.1,69.2,-4.7,55.0,-5.0C40.8,-5.4,-2.2,-14.4,-15.0,-16.6" fill="none" stroke="#14b1ab" strokeDasharray="24 4" strokeWidth="1.6"/>
            <path d="M935.0,-5.0C922.2,-3.3,878.3,5.3,865.0,4.0C851.7,2.7,801.9,-18.5,790.0,-19.0C778.1,-19.5,747.8,-1.4,735.0,-1.4C722.2,-1.4,664.2,-20.1,650.0,-19.5C635.8,-18.9,592.4,5.4,580.0,5.6C567.6,5.8,527.4,-17.5,515.0,-17.0C502.6,-16.5,457.8,9.7,445.0,11.4C432.2,13.1,388.8,4.1,375.0,1.5C361.2,-1.1,310.1,-18.0,295.0,-17.5C279.9,-17.0,224.2,5.5,210.0,6.6C195.8,7.7,154.2,-4.7,140.0,-5.0C125.8,-5.3,69.2,3.7,55.0,3.4C40.8,3.1,-2.2,-6.3,-15.0,-8.5" fill="none" stroke="#38bdf8" strokeDasharray="11 3" strokeWidth="1.6"/>
            <path d="M935.0,3.2C922.2,4.7,878.3,13.1,865.0,11.7C851.7,10.3,801.9,-11.3,790.0,-11.8C778.1,-12.3,747.8,6.3,735.0,6.2C722.2,6.1,664.2,-13.2,650.0,-12.5C635.8,-11.9,592.4,13.4,580.0,13.7C567.6,13.9,527.4,-10.3,515.0,-9.8C502.6,-9.3,457.8,17.5,445.0,19.2C432.2,20.9,388.8,11.7,375.0,8.9C361.2,6.2,310.1,-11.0,295.0,-10.5C279.9,-10.1,224.2,13.0,210.0,14.2C195.8,15.4,154.2,2.5,140.0,2.2C125.8,1.9,69.2,11.5,55.0,11.2C40.8,10.9,-2.2,1.2,-15.0,-1.1" fill="none" stroke="#c084fc" strokeDasharray="11 4" strokeWidth="1.6"/>
            <path d="M935.0,10.6C922.2,12.1,878.3,20.2,865.0,18.7C851.7,17.3,801.9,-4.7,790.0,-5.2C778.1,-5.7,747.8,13.2,735.0,13.1C722.2,13.0,664.2,-6.9,650.0,-6.2C635.8,-5.4,592.4,20.8,580.0,21.1C567.6,21.3,527.4,-3.7,515.0,-3.2C502.6,-2.7,457.8,24.6,445.0,26.3C432.2,28.0,388.8,18.6,375.0,15.8C361.2,13.0,310.1,-4.7,295.0,-4.2C279.9,-3.7,224.2,19.9,210.0,21.1C195.8,22.3,154.2,9.1,140.0,8.8C125.8,8.5,69.2,18.6,55.0,18.3C40.8,18.0,-2.2,8.1,-15.0,5.8" fill="none" stroke="#14b1ab" strokeDasharray="31 4" strokeWidth="1.6"/>
            <path d="M935.0,17.9C922.2,19.4,878.3,27.1,865.0,25.6C851.7,24.1,801.9,1.8,790.0,1.2C778.1,0.7,747.8,20.0,735.0,19.9C722.2,19.8,664.2,-0.7,650.0,0.1C635.8,0.8,592.4,28.0,580.0,28.3C567.6,28.6,527.4,2.8,515.0,3.2C502.6,3.7,457.8,31.5,445.0,33.3C432.2,35.0,388.8,25.3,375.0,22.4C361.2,19.6,310.1,1.6,295.0,2.1C279.9,2.6,224.2,26.7,210.0,27.9C195.8,29.1,154.2,15.5,140.0,15.2C125.8,15.0,69.2,25.5,55.0,25.3C40.8,25.0,-2.2,14.8,-15.0,12.4" fill="none" stroke="#e8505b" strokeDasharray="27 5" strokeWidth="1.6"/>
            <path d="M935.0,24.9C922.2,26.2,878.3,33.8,865.0,32.2C851.7,30.6,801.9,7.9,790.0,7.4C778.1,6.9,747.8,26.5,735.0,26.4C722.2,26.3,664.2,5.2,650.0,6.0C635.8,6.8,592.4,34.9,580.0,35.2C567.6,35.5,527.4,9.0,515.0,9.4C502.6,9.8,457.8,38.1,445.0,39.9C432.2,41.7,388.8,31.7,375.0,28.8C361.2,25.9,310.1,7.5,295.0,8.0C279.9,8.5,224.2,33.2,210.0,34.4C195.8,35.6,154.2,21.6,140.0,21.4C125.8,21.2,69.2,32.2,55.0,31.9C40.8,31.7,-2.2,21.2,-15.0,18.8" fill="none" stroke="#f9d56e" strokeDasharray="23 2" strokeWidth="1.6"/>
            <path d="M935.0,32.4C922.2,33.6,878.3,40.9,865.0,39.2C851.7,37.5,801.9,14.5,790.0,14.0C778.1,13.5,747.8,33.5,735.0,33.4C722.2,33.2,664.2,11.6,650.0,12.4C635.8,13.2,592.4,42.2,580.0,42.6C567.6,42.9,527.4,15.6,515.0,16.0C502.6,16.4,457.8,45.2,445.0,47.0C432.2,48.8,388.8,38.6,375.0,35.6C361.2,32.6,310.1,13.9,295.0,14.4C279.9,14.9,224.2,40.1,210.0,41.4C195.8,42.6,154.2,28.2,140.0,28.0C125.8,27.8,69.2,39.3,55.0,39.0C40.8,38.8,-2.2,28.1,-15.0,25.6" fill="none" stroke="#38bdf8" strokeDasharray="15 2" strokeWidth="1.6"/>
            <path d="M935.0,40.0C922.2,41.2,878.3,48.2,865.0,46.4C851.7,44.6,801.9,21.3,790.0,20.8C778.1,20.2,747.8,40.6,735.0,40.5C722.2,40.3,664.2,18.0,650.0,18.9C635.8,19.8,592.4,49.8,580.0,50.1C567.6,50.5,527.4,22.4,515.0,22.8C502.6,23.1,457.8,52.5,445.0,54.3C432.2,56.1,388.8,45.6,375.0,42.6C361.2,39.5,310.1,20.4,295.0,20.9C279.9,21.5,224.2,47.2,210.0,48.5C195.8,49.7,154.2,34.9,140.0,34.8C125.8,34.6,69.2,46.5,55.0,46.3C40.8,46.1,-2.2,35.1,-15.0,32.6" fill="none" stroke="#14b1ab" strokeDasharray="9 2" strokeWidth="1.6"/>
            <path d="M935.0,48.5C922.2,49.6,878.3,56.3,865.0,54.4C851.7,52.5,801.9,28.8,790.0,28.2C778.1,27.7,747.8,48.6,735.0,48.4C722.2,48.2,664.2,25.2,650.0,26.2C635.8,27.1,592.4,58.1,580.0,58.5C567.6,58.9,527.4,29.9,515.0,30.2C502.6,30.6,457.8,60.6,445.0,62.4C432.2,64.3,388.8,53.5,375.0,50.3C361.2,47.2,310.1,27.6,295.0,28.2C279.9,28.7,224.2,55.1,210.0,56.4C195.8,57.7,154.2,42.4,140.0,42.2C125.8,42.1,69.2,54.6,55.0,54.4C40.8,54.3,-2.2,42.9,-15.0,40.3" fill="none" stroke="#c084fc" strokeDasharray="28 3" strokeWidth="1.6"/>
            <path d="M935.0,57.6C922.2,58.5,878.3,64.8,865.0,62.9C851.7,60.9,801.9,36.8,790.0,36.2C778.1,35.6,747.8,57.0,735.0,56.7C722.2,56.5,664.2,32.9,650.0,33.9C635.8,34.8,592.4,67.0,580.0,67.4C567.6,67.8,527.4,37.9,515.0,38.2C502.6,38.5,457.8,69.2,445.0,71.0C432.2,72.9,388.8,61.8,375.0,58.5C361.2,55.3,310.1,35.3,295.0,35.9C279.9,36.4,224.2,63.4,210.0,64.7C195.8,66.1,154.2,50.4,140.0,50.2C125.8,50.0,69.2,63.2,55.0,63.0C40.8,62.9,-2.2,51.2,-15.0,48.5" fill="none" stroke="#f9d56e" strokeDasharray="21 3" strokeWidth="1.6"/>
            <path d="M935.0,67.8C922.2,68.6,878.3,74.5,865.0,72.5C851.7,70.4,801.9,45.8,790.0,45.2C778.1,44.6,747.8,66.5,735.0,66.2C722.2,66.0,664.2,41.5,650.0,42.6C635.8,43.6,592.4,77.1,580.0,77.5C567.6,77.9,527.4,46.9,515.0,47.2C502.6,47.5,457.8,78.8,445.0,80.7C432.2,82.6,388.8,71.2,375.0,67.8C361.2,64.5,310.1,44.0,295.0,44.6C279.9,45.1,224.2,72.9,210.0,74.2C195.8,75.6,154.2,59.3,140.0,59.2C125.8,59.1,69.2,72.9,55.0,72.7C40.8,72.6,-2.2,60.6,-15.0,57.8" fill="none" stroke="#e8505b" strokeDasharray="16 3" strokeWidth="1.6"/>
            <path d="M935.0,78.3C922.2,79.1,878.3,84.6,865.0,82.4C851.7,80.2,801.9,55.1,790.0,54.5C778.1,53.9,747.8,76.3,735.0,76.0C722.2,75.7,664.2,50.5,650.0,51.5C635.8,52.6,592.4,87.5,580.0,87.9C567.6,88.4,527.4,56.2,515.0,56.5C502.6,56.8,457.8,88.9,445.0,90.8C432.2,92.7,388.8,80.9,375.0,77.5C361.2,74.0,310.1,52.9,295.0,53.5C279.9,54.2,224.2,82.6,210.0,84.0C195.8,85.4,154.2,68.6,140.0,68.5C125.8,68.4,69.2,82.9,55.0,82.8C40.8,82.7,-2.2,70.3,-15.0,67.5" fill="none" stroke="#14b1ab" strokeDasharray="20 5" strokeWidth="1.6"/>
            <path d="M935.0,88.8C922.2,89.5,878.3,94.6,865.0,92.3C851.7,90.0,801.9,64.4,790.0,63.8C778.1,63.2,747.8,86.1,735.0,85.8C722.2,85.5,664.2,59.4,650.0,60.5C635.8,61.7,592.4,97.9,580.0,98.3C567.6,98.8,527.4,65.6,515.0,65.8C502.6,66.0,457.8,98.9,445.0,100.8C432.2,102.8,388.8,90.6,375.0,87.1C361.2,83.6,310.1,61.9,295.0,62.5C279.9,63.2,224.2,92.4,210.0,93.8C195.8,95.2,154.2,77.9,140.0,77.8C125.8,77.7,69.2,92.9,55.0,92.8C40.8,92.8,-2.2,80.0,-15.0,77.1" fill="none" stroke="#38bdf8" strokeDasharray="26 3" strokeWidth="1.6"/>
            <path d="M935.0,99.5C922.2,100.1,878.3,104.8,865.0,102.4C851.7,100.0,801.9,73.9,790.0,73.2C778.1,72.6,747.8,96.1,735.0,95.8C722.2,95.4,664.2,68.5,650.0,69.7C635.8,70.9,592.4,108.4,580.0,108.9C567.6,109.4,527.4,75.1,515.0,75.2C502.6,75.4,457.8,109.1,445.0,111.0C432.2,113.0,388.8,100.4,375.0,96.8C361.2,93.2,310.1,71.0,295.0,71.7C279.9,72.3,224.2,102.3,210.0,103.8C195.8,105.2,154.2,87.3,140.0,87.2C125.8,87.2,69.2,103.1,55.0,103.0C40.8,103.0,-2.2,89.8,-15.0,86.8" fill="none" stroke="#c084fc" strokeDasharray="14 4" strokeWidth="1.6"/>
            <path d="M935.0,110.3C922.2,110.7,878.3,115.0,865.0,112.5C851.7,110.0,801.9,83.3,790.0,82.7C778.1,82.1,747.8,106.1,735.0,105.7C722.2,105.4,664.2,77.5,650.0,78.8C635.8,80.1,592.4,119.0,580.0,119.5C567.6,120.0,527.4,84.5,515.0,84.7C502.6,84.9,457.8,119.2,445.0,121.2C432.2,123.2,388.8,110.3,375.0,106.6C361.2,102.9,310.1,80.2,295.0,80.8C279.9,81.5,224.2,112.3,210.0,113.7C195.8,115.2,154.2,96.7,140.0,96.7C125.8,96.7,69.2,113.2,55.0,113.2C40.8,113.2,-2.2,99.6,-15.0,96.6" fill="none" stroke="#f9d56e" strokeDasharray="12 5" strokeWidth="1.6"/>
            <path d="M935.0,121.1C922.2,121.4,878.3,125.4,865.0,122.7C851.7,120.1,801.9,92.9,790.0,92.3C778.1,91.7,747.8,116.2,735.0,115.8C722.2,115.5,664.2,86.8,650.0,88.1C635.8,89.4,592.4,129.7,580.0,130.3C567.6,130.8,527.4,94.2,515.0,94.3C502.6,94.4,457.8,129.6,445.0,131.6C432.2,133.6,388.8,120.3,375.0,116.5C361.2,112.7,310.1,89.4,295.0,90.1C279.9,90.8,224.2,122.4,210.0,123.8C195.8,125.3,154.2,106.3,140.0,106.3C125.8,106.3,69.2,123.6,55.0,123.6C40.8,123.6,-2.2,109.6,-15.0,106.5" fill="none" stroke="#e8505b" strokeDasharray="17 4" strokeWidth="1.6"/>
            <path d="M935.0,131.8C922.2,132.0,878.3,135.6,865.0,132.8C851.7,130.0,801.9,102.4,790.0,101.8C778.1,101.1,747.8,126.2,735.0,125.8C722.2,125.4,664.2,95.8,650.0,97.2C635.8,98.6,592.4,140.2,580.0,140.8C567.6,141.4,527.4,103.7,515.0,103.8C502.6,103.8,457.8,139.7,445.0,141.8C432.2,143.9,388.8,130.2,375.0,126.3C361.2,122.4,310.1,98.5,295.0,99.2C279.9,99.9,224.2,132.3,210.0,133.8C195.8,135.3,154.2,115.7,140.0,115.8C125.8,115.8,69.2,133.8,55.0,133.8C40.8,133.9,-2.2,119.5,-15.0,116.3" fill="none" stroke="#14b1ab" strokeDasharray="26 3" strokeWidth="1.6"/>
          </svg>
        </div>

        {/* ── 2. BOTTOM-RIGHT DIAGONAL WAVE CLUSTER WRAPPER ── */}
        <div
          style={{
            position: 'absolute',
            bottom: `${waveConfig.wave2.bottom}vh`,
            right: `${waveConfig.wave2.right}vw`,
            width: `${waveConfig.wave2.width}vw`,
            minWidth: '2200px',
            height: `${waveConfig.wave2.height}vh`,
            opacity: waveConfig.wave2.opacity,
            transform: `rotate(${waveConfig.wave2.rot}deg) scale(${waveConfig.wave2.scale})`,
            transformOrigin: '100% 100%',
            filter: `blur(${waveConfig.wave2.blur}px)`,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 16%, black 84%, rgba(0,0,0,0.5) 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 16%, black 84%, rgba(0,0,0,0.5) 92%, transparent 100%)',
            transition: 'none',
          }}
        >
          <svg
            className="wavy-cluster-svg"
            viewBox="0 500 922 155"
            preserveAspectRatio="xMidYMid slice"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <path d="M935.0,527.2C922.2,528.9,878.3,537.6,865.0,536.3C851.7,535.1,801.9,513.9,790.0,513.4C778.1,512.9,747.8,531.0,735.0,530.9C722.2,530.9,664.2,512.3,650.0,513.0C635.8,513.6,592.4,537.6,580.0,537.8C567.6,538.1,527.4,514.9,515.0,515.4C502.6,516.0,457.8,542.0,445.0,543.7C432.2,545.4,388.8,536.5,375.0,533.9C361.2,531.2,310.1,514.5,295.0,515.0C279.9,515.4,224.2,537.8,210.0,538.9C195.8,540.1,154.2,527.7,140.0,527.4C125.8,527.1,69.2,536.0,55.0,535.7C40.8,535.4,-2.2,526.0,-15.0,523.9" fill="none" stroke="#e8505b" strokeDasharray="8 5" strokeWidth="1.6"/>
            <path d="M935.0,533.5C922.2,535.1,878.3,543.6,865.0,542.3C851.7,540.9,801.9,519.5,790.0,519.0C778.1,518.5,747.8,536.9,735.0,536.8C722.2,536.7,664.2,517.7,650.0,518.4C635.8,519.0,592.4,543.8,580.0,544.1C567.6,544.3,527.4,520.5,515.0,521.0C502.6,521.5,457.8,548.0,445.0,549.7C432.2,551.4,388.8,542.3,375.0,539.6C361.2,536.9,310.1,519.9,295.0,520.4C279.9,520.8,224.2,543.6,210.0,544.8C195.8,546.0,154.2,533.3,140.0,533.0C125.8,532.7,69.2,542.0,55.0,541.7C40.8,541.4,-2.2,531.8,-15.0,529.6" fill="none" stroke="#f9d56e" strokeDasharray="23 2" strokeWidth="1.6"/>
            <path d="M935.0,539.6C922.2,541.1,878.3,549.4,865.0,548.0C851.7,546.6,801.9,524.9,790.0,524.4C778.1,523.9,747.8,542.5,735.0,542.5C722.2,542.4,664.2,522.8,650.0,523.5C635.8,524.2,592.4,549.8,580.0,550.1C567.6,550.3,527.4,525.9,515.0,526.4C502.6,526.9,457.8,553.8,445.0,555.5C432.2,557.2,388.8,547.9,375.0,545.2C361.2,542.4,310.1,525.1,295.0,525.5C279.9,526.0,224.2,549.3,210.0,550.5C195.8,551.6,154.2,538.6,140.0,538.4C125.8,538.1,69.2,547.8,55.0,547.5C40.8,547.2,-2.2,537.4,-15.0,535.2" fill="none" stroke="#14b1ab" strokeDasharray="24 4" strokeWidth="1.6"/>
            <path d="M935.0,545.6C922.2,547.0,878.3,555.1,865.0,553.6C851.7,552.1,801.9,530.1,790.0,529.6C778.1,529.1,747.8,548.1,735.0,548.0C722.2,547.9,664.2,527.9,650.0,528.6C635.8,529.4,592.4,555.7,580.0,556.0C567.6,556.3,527.4,531.1,515.0,531.6C502.6,532.1,457.8,559.5,445.0,561.2C432.2,562.9,388.8,553.4,375.0,550.6C361.2,547.8,310.1,530.1,295.0,530.6C279.9,531.1,224.2,554.8,210.0,556.0C195.8,557.2,154.2,543.9,140.0,543.6C125.8,543.4,69.2,553.5,55.0,553.2C40.8,552.9,-2.2,542.9,-15.0,540.6" fill="none" stroke="#38bdf8" strokeDasharray="11 3" strokeWidth="1.6"/>
            <path d="M935.0,551.1C922.2,552.5,878.3,560.3,865.0,558.8C851.7,557.3,801.9,535.0,790.0,534.5C778.1,534.0,747.8,553.2,735.0,553.1C722.2,553.0,664.2,532.6,650.0,533.3C635.8,534.1,592.4,561.1,580.0,561.4C567.6,561.7,527.4,536.0,515.0,536.5C502.6,536.9,457.8,564.7,445.0,566.4C432.2,568.2,388.8,558.5,375.0,555.6C361.2,552.8,310.1,534.8,295.0,535.3C279.9,535.8,224.2,559.9,210.0,561.1C195.8,562.3,154.2,548.7,140.0,548.5C125.8,548.2,69.2,558.7,55.0,558.4C40.8,558.2,-2.2,548.0,-15.0,545.6" fill="none" stroke="#c084fc" strokeDasharray="11 4" strokeWidth="1.6"/>
            <path d="M935.0,556.1C922.2,557.5,878.3,565.1,865.0,563.5C851.7,562.0,801.9,539.5,790.0,538.9C778.1,538.4,747.8,557.9,735.0,557.8C722.2,557.7,664.2,536.9,650.0,537.6C635.8,538.4,592.4,566.1,580.0,566.4C567.6,566.7,527.4,540.5,515.0,540.9C502.6,541.4,457.8,569.5,445.0,571.3C432.2,573.0,388.8,563.1,375.0,560.2C361.2,557.3,310.1,539.1,295.0,539.6C279.9,540.2,224.2,564.6,210.0,565.8C195.8,567.0,154.2,553.2,140.0,552.9C125.8,552.7,69.2,563.5,55.0,563.3C40.8,563.0,-2.2,552.6,-15.0,550.2" fill="none" stroke="#14b1ab" strokeDasharray="31 4" strokeWidth="1.6"/>
            <path d="M935.0,561.1C922.2,562.4,878.3,569.8,865.0,568.2C851.7,566.6,801.9,543.8,790.0,543.3C778.1,542.8,747.8,562.5,735.0,562.4C722.2,562.3,664.2,541.0,650.0,541.9C635.8,542.7,592.4,571.0,580.0,571.3C567.6,571.6,527.4,544.9,515.0,545.3C502.6,545.7,457.8,574.2,445.0,576.0C432.2,577.7,388.8,567.7,375.0,564.7C361.2,561.8,310.1,543.3,295.0,543.9C279.9,544.4,224.2,569.2,210.0,570.4C195.8,571.6,154.2,557.5,140.0,557.3C125.8,557.1,69.2,568.2,55.0,568.0C40.8,567.7,-2.2,557.2,-15.0,554.7" fill="none" stroke="#e8505b" strokeDasharray="27 5" strokeWidth="1.6"/>
            <path d="M935.0,565.8C922.2,567.0,878.3,574.3,865.0,572.6C851.7,570.9,801.9,548.0,790.0,547.4C778.1,546.9,747.8,566.9,735.0,566.8C722.2,566.6,664.2,545.0,650.0,545.9C635.8,546.7,592.4,575.6,580.0,575.9C567.6,576.3,527.4,549.0,515.0,549.4C502.6,549.9,457.8,578.6,445.0,580.4C432.2,582.2,388.8,572.0,375.0,569.0C361.2,566.0,310.1,547.3,295.0,547.9C279.9,548.4,224.2,573.5,210.0,574.8C195.8,576.0,154.2,561.7,140.0,561.4C125.8,561.2,69.2,572.7,55.0,572.4C40.8,572.2,-2.2,561.5,-15.0,559.0" fill="none" stroke="#f9d56e" strokeDasharray="23 2" strokeWidth="1.6"/>
            <path d="M935.0,570.8C922.2,572.0,878.3,579.1,865.0,577.4C851.7,575.6,801.9,552.4,790.0,551.9C778.1,551.4,747.8,571.6,735.0,571.5C722.2,571.3,664.2,549.3,650.0,550.2C635.8,551.0,592.4,580.6,580.0,580.9C567.6,581.3,527.4,553.5,515.0,553.9C502.6,554.3,457.8,583.4,445.0,585.3C432.2,587.1,388.8,576.7,375.0,573.6C361.2,570.6,310.1,551.6,295.0,552.2C279.9,552.7,224.2,578.2,210.0,579.5C195.8,580.7,154.2,566.1,140.0,565.9C125.8,565.7,69.2,577.5,55.0,577.3C40.8,577.0,-2.2,566.1,-15.0,563.6" fill="none" stroke="#38bdf8" strokeDasharray="15 2" strokeWidth="1.6"/>
            <path d="M935.0,576.0C922.2,577.1,878.3,584.0,865.0,582.2C851.7,580.4,801.9,557.0,790.0,556.5C778.1,555.9,747.8,576.4,735.0,576.3C722.2,576.1,664.2,553.7,650.0,554.6C635.8,555.5,592.4,585.7,580.0,586.0C567.6,586.4,527.4,558.1,515.0,558.5C502.6,558.8,457.8,588.4,445.0,590.2C432.2,592.0,388.8,581.4,375.0,578.3C361.2,575.3,310.1,556.0,295.0,556.6C279.9,557.1,224.2,583.0,210.0,584.3C195.8,585.5,154.2,570.6,140.0,570.5C125.8,570.3,69.2,582.4,55.0,582.2C40.8,582.0,-2.2,570.9,-15.0,568.3" fill="none" stroke="#14b1ab" strokeDasharray="9 2" strokeWidth="1.6"/>
            <path d="M935.0,581.7C922.2,582.8,878.3,589.5,865.0,587.6C851.7,585.8,801.9,562.1,790.0,561.5C778.1,561.0,747.8,581.8,735.0,581.6C722.2,581.4,664.2,558.5,650.0,559.5C635.8,560.4,592.4,591.3,580.0,591.7C567.6,592.1,527.4,563.2,515.0,563.5C502.6,563.9,457.8,593.8,445.0,595.6C432.2,597.5,388.8,586.7,375.0,583.6C361.2,580.4,310.1,560.9,295.0,561.5C279.9,562.0,224.2,588.3,210.0,589.6C195.8,590.9,154.2,575.7,140.0,575.5C125.8,575.3,69.2,587.8,55.0,587.6C40.8,587.5,-2.2,576.1,-15.0,573.6" fill="none" stroke="#c084fc" strokeDasharray="28 3" strokeWidth="1.6"/>
            <path d="M935.0,587.8C922.2,588.8,878.3,595.3,865.0,593.3C851.7,591.4,801.9,567.4,790.0,566.9C778.1,566.3,747.8,587.5,735.0,587.3C722.2,587.0,664.2,563.7,650.0,564.7C635.8,565.6,592.4,597.3,580.0,597.7C567.6,598.1,527.4,568.5,515.0,568.9C502.6,569.2,457.8,599.6,445.0,601.4C432.2,603.3,388.8,592.3,375.0,589.1C361.2,585.9,310.1,566.1,295.0,566.7C279.9,567.2,224.2,593.9,210.0,595.3C195.8,596.6,154.2,581.1,140.0,580.9C125.8,580.7,69.2,593.6,55.0,593.4C40.8,593.3,-2.2,581.7,-15.0,579.1" fill="none" stroke="#f9d56e" strokeDasharray="21 3" strokeWidth="1.6"/>
            <path d="M935.0,594.7C922.2,595.6,878.3,601.8,865.0,599.8C851.7,597.8,801.9,573.5,790.0,573.0C778.1,572.4,747.8,593.9,735.0,593.7C722.2,593.4,664.2,569.5,650.0,570.5C635.8,571.5,592.4,604.1,580.0,604.5C567.6,604.9,527.4,574.6,515.0,575.0C502.6,575.3,457.8,606.1,445.0,608.0C432.2,609.9,388.8,598.6,375.0,595.4C361.2,592.1,310.1,572.0,295.0,572.5C279.9,573.1,224.2,600.3,210.0,601.7C195.8,603.0,154.2,587.1,140.0,587.0C125.8,586.8,69.2,600.1,55.0,600.0C40.8,599.9,-2.2,588.1,-15.0,585.4" fill="none" stroke="#e8505b" strokeDasharray="16 3" strokeWidth="1.6"/>
            <path d="M935.0,601.8C922.2,602.7,878.3,608.6,865.0,606.5C851.7,604.5,801.9,579.8,790.0,579.2C778.1,578.7,747.8,600.5,735.0,600.3C722.2,600.0,664.2,575.6,650.0,576.6C635.8,577.6,592.4,611.1,580.0,611.5C567.6,612.0,527.4,580.9,515.0,581.2C502.6,581.5,457.8,612.9,445.0,614.8C432.2,616.7,388.8,605.2,375.0,601.9C361.2,598.6,310.1,578.0,295.0,578.6C279.9,579.2,224.2,606.9,210.0,608.3C195.8,609.6,154.2,593.4,140.0,593.2C125.8,593.1,69.2,606.9,55.0,606.8C40.8,606.7,-2.2,594.6,-15.0,591.9" fill="none" stroke="#14b1ab" strokeDasharray="20 5" strokeWidth="1.6"/>
            <path d="M935.0,608.9C922.2,609.7,878.3,615.4,865.0,613.2C851.7,611.1,801.9,586.1,790.0,585.5C778.1,584.9,747.8,607.1,735.0,606.9C722.2,606.6,664.2,581.6,650.0,582.7C635.8,583.7,592.4,618.1,580.0,618.6C567.6,619.0,527.4,587.2,515.0,587.5C502.6,587.8,457.8,619.6,445.0,621.6C432.2,623.5,388.8,611.7,375.0,608.4C361.2,605.0,310.1,584.1,295.0,584.7C279.9,585.3,224.2,613.5,210.0,614.9C195.8,616.2,154.2,599.6,140.0,599.5C125.8,599.4,69.2,613.7,55.0,613.6C40.8,613.5,-2.2,601.2,-15.0,598.4" fill="none" stroke="#38bdf8" strokeDasharray="26 3" strokeWidth="1.6"/>
            <path d="M935.0,616.1C922.2,616.9,878.3,622.2,865.0,620.0C851.7,617.8,801.9,592.5,790.0,591.9C778.1,591.3,747.8,613.9,735.0,613.6C722.2,613.3,664.2,587.7,650.0,588.8C635.8,589.9,592.4,625.3,580.0,625.7C567.6,626.2,527.4,593.6,515.0,593.9C502.6,594.1,457.8,626.5,445.0,628.4C432.2,630.4,388.8,618.4,375.0,615.0C361.2,611.5,310.1,590.2,295.0,590.8C279.9,591.4,224.2,620.2,210.0,621.6C195.8,623.0,154.2,606.0,140.0,605.9C125.8,605.8,69.2,620.5,55.0,620.4C40.8,620.4,-2.2,607.8,-15.0,605.0" fill="none" stroke="#c084fc" strokeDasharray="14 4" strokeWidth="1.6"/>
            <path d="M935.0,623.4C922.2,624.0,878.3,629.1,865.0,626.8C851.7,624.5,801.9,598.9,790.0,598.3C778.1,597.7,747.8,620.6,735.0,620.3C722.2,620.0,664.2,593.8,650.0,595.0C635.8,596.1,592.4,632.4,580.0,632.9C567.6,633.3,527.4,600.0,515.0,600.3C502.6,600.5,457.8,633.4,445.0,635.3C432.2,637.3,388.8,625.1,375.0,621.5C361.2,618.0,310.1,596.4,295.0,597.0C279.9,597.6,224.2,626.9,210.0,628.3C195.8,629.7,154.2,612.4,140.0,612.3C125.8,612.2,69.2,627.4,55.0,627.3C40.8,627.3,-2.2,614.4,-15.0,611.5" fill="none" stroke="#f9d56e" strokeDasharray="12 5" strokeWidth="1.6"/>
            <path d="M935.0,630.7C922.2,631.3,878.3,636.1,865.0,633.7C851.7,631.4,801.9,605.4,790.0,604.8C778.1,604.1,747.8,627.5,735.0,627.1C722.2,626.8,664.2,600.1,650.0,601.3C635.8,602.5,592.4,639.6,580.0,640.1C567.6,640.6,527.4,606.5,515.0,606.8C502.6,607.0,457.8,640.4,445.0,642.3C432.2,644.3,388.8,631.8,375.0,628.2C361.2,624.7,310.1,602.6,295.0,603.3C279.9,603.9,224.2,633.7,210.0,635.1C195.8,636.6,154.2,618.8,140.0,618.8C125.8,618.7,69.2,634.4,55.0,634.3C40.8,634.3,-2.2,621.2,-15.0,618.2" fill="none" stroke="#e8505b" strokeDasharray="17 4" strokeWidth="1.6"/>
            <path d="M935.0,637.9C922.2,638.4,878.3,643.0,865.0,640.5C851.7,638.1,801.9,611.7,790.0,611.1C778.1,610.5,747.8,634.2,735.0,633.9C722.2,633.5,664.2,606.2,650.0,607.4C635.8,608.7,592.4,646.7,580.0,647.3C567.6,647.8,527.4,613.0,515.0,613.1C502.6,613.3,457.8,647.2,445.0,649.2C432.2,651.2,388.8,638.5,375.0,634.8C361.2,631.2,310.1,608.8,295.0,609.4C279.9,610.1,224.2,640.4,210.0,641.9C195.8,643.3,154.2,625.2,140.0,625.1C125.8,625.1,69.2,641.2,55.0,641.2C40.8,641.2,-2.2,627.8,-15.0,624.8" fill="none" stroke="#14b1ab" strokeDasharray="26 3" strokeWidth="1.6"/>
          </svg>
        </div>
      </div>

      {/* ── 3. MOVEABLE ANYWHERE CUSTOMIZATION TUNER DOCK FOR ASK VEDIKA ── */}
      <div
        style={{
          position: 'fixed',
          bottom: showTuner ? 'auto' : 24,
          right: showTuner ? 'auto' : 24,
          left: showTuner ? `${dockPos.x}px` : 'auto',
          top: showTuner ? `${dockPos.y}px` : 'auto',
          zIndex: 99999,
          pointerEvents: 'auto',
          fontFamily: 'var(--font-outfit), "Plus Jakarta Sans", system-ui, sans-serif',
        }}
      >
        {/* Toggle Pill Button (when collapsed) */}
        {!showTuner ? (
          <button
            onClick={() => setShowTuner(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 9999,
              background: 'linear-gradient(135deg, rgba(20, 177, 171, 0.35) 0%, rgba(192, 132, 252, 0.35) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55), 0 0 16px rgba(20, 177, 171, 0.25)',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
            }}
          >
            <span style={{ fontSize: 15 }}>🌊</span>
            <span>Tune Waves BG</span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block',
              }}
            />
          </button>
        ) : (
          /* Moveable Studio Control Panel Window */
          <div
            style={{
              width: 375,
              maxHeight: 'calc(100vh - 100px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8, 12, 24, 0.95)',
              border: isDragging ? '1px solid rgba(20, 177, 171, 0.6)' : '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 18,
              boxShadow: isDragging
                ? '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 24px rgba(20, 177, 171, 0.3)'
                : '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              overflow: 'hidden',
              userSelect: isDragging ? 'none' : 'auto',
              transition: isDragging ? 'box-shadow 0.15s ease, border-color 0.15s ease' : 'border-color 0.2s ease',
            }}
          >
            {/* Draggable Header Bar */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDragging
                  ? 'linear-gradient(135deg, rgba(20, 177, 171, 0.18) 0%, rgba(192, 132, 252, 0.18) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
              }}
              title="Click and drag to move panel anywhere on screen"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    color: '#94A3B8',
                    fontSize: 16,
                    letterSpacing: '-2px',
                    display: 'inline-flex',
                    opacity: 0.8,
                  }}
                >
                  ⠿
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🌊</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                      Waves Studio
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(20, 177, 171, 0.2)',
                        color: '#14B1AB',
                        border: '1px solid rgba(20, 177, 171, 0.35)',
                      }}
                    >
                      DRAG
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                    Hold header & move anywhere on screen
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTuner(false)}
                title="Minimize Tuner"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                padding: '8px 12px',
                gap: 6,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              {[
                { id: 'wave1', label: 'Wave 1 (Top-Left)', color: '#14B1AB' },
                { id: 'wave2', label: 'Wave 2 (Bottom-Right)', color: '#C084FC' },
                { id: 'global', label: 'Motion', color: '#F9D56E' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
                    background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    border: activeTab === tab.id ? `1px solid ${tab.color}` : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Sliders Container */}
            <div
              style={{
                padding: '14px 16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flex: 1,
              }}
            >
              {/* TAB 1: WAVE 1 (TOP-LEFT) */}
              {activeTab === 'wave1' && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#14B1AB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Top-Left Diagonal Wave Parameters
                  </div>

                  {[
                    { key: 'top', label: 'Top Position', min: -60, max: 40, step: 1, unit: 'vh', color: '#14B1AB' },
                    { key: 'left', label: 'Left Position', min: -60, max: 40, step: 1, unit: 'vw', color: '#14B1AB' },
                    { key: 'width', label: 'Width Coverage', min: 80, max: 280, step: 5, unit: 'vw', color: '#38BDF8' },
                    { key: 'height', label: 'Height Coverage', min: 20, max: 140, step: 5, unit: 'vh', color: '#38BDF8' },
                    { key: 'rot', label: 'Diagonal Angle', min: -90, max: 90, step: 1, unit: '°', color: '#C084FC' },
                    { key: 'scale', label: 'Scale Factor', min: 0.5, max: 2.2, step: 0.05, unit: 'x', color: '#F9D56E' },
                    { key: 'blur', label: 'Blur / Softness', min: 0, max: 6.0, step: 0.1, unit: 'px', color: '#E8505B' },
                    { key: 'opacity', label: 'Opacity', min: 0.1, max: 1.0, step: 0.05, unit: '', color: '#CBD5E1' },
                  ].map(({ key, label, min, max, step, unit, color }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: color, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {waveConfig.wave1[key]} {unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={waveConfig.wave1[key] ?? DEFAULT_WAVE_CONFIG.wave1[key]}
                        onChange={e => handleConfigChange('wave1', key, e.target.value)}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                          height: 4,
                        }}
                      />
                    </div>
                  ))}
                </>
              )}

              {/* TAB 2: WAVE 2 (BOTTOM-RIGHT) */}
              {activeTab === 'wave2' && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Bottom-Right Diagonal Wave Parameters
                  </div>

                  {[
                    { key: 'bottom', label: 'Bottom Position', min: -60, max: 40, step: 1, unit: 'vh', color: '#C084FC' },
                    { key: 'right', label: 'Right Position', min: -60, max: 40, step: 1, unit: 'vw', color: '#C084FC' },
                    { key: 'width', label: 'Width Coverage', min: 80, max: 280, step: 5, unit: 'vw', color: '#38BDF8' },
                    { key: 'height', label: 'Height Coverage', min: 20, max: 140, step: 5, unit: 'vh', color: '#38BDF8' },
                    { key: 'rot', label: 'Diagonal Angle', min: -90, max: 90, step: 1, unit: '°', color: '#14B1AB' },
                    { key: 'scale', label: 'Scale Factor', min: 0.5, max: 2.2, step: 0.05, unit: 'x', color: '#F9D56E' },
                    { key: 'blur', label: 'Blur / Softness', min: 0, max: 6.0, step: 0.1, unit: 'px', color: '#E8505B' },
                    { key: 'opacity', label: 'Opacity', min: 0.1, max: 1.0, step: 0.05, unit: '', color: '#CBD5E1' },
                  ].map(({ key, label, min, max, step, unit, color }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: color, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {waveConfig.wave2[key]} {unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={waveConfig.wave2[key] ?? DEFAULT_WAVE_CONFIG.wave2[key]}
                        onChange={e => handleConfigChange('wave2', key, e.target.value)}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                          height: 4,
                        }}
                      />
                    </div>
                  ))}
                </>
              )}

              {/* TAB 3: MOTION & GLOBAL */}
              {activeTab === 'global' && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#F9D56E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Continuous Flow Speed & Sway Dynamics
                  </div>

                  {[
                    { key: 'speedMult', label: 'Wave Stroke Flow Speed', min: 0.2, max: 3.0, step: 0.1, unit: 'x', color: '#F9D56E' },
                    { key: 'sway', label: 'Diagonal Floating Sway Amplitude', min: 0, max: 60, step: 2, unit: 'px', color: '#38BDF8' },
                  ].map(({ key, label, min, max, step, unit, color }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: color, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {waveConfig.global[key]} {unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={waveConfig.global[key] ?? DEFAULT_WAVE_CONFIG.global[key]}
                        onChange={e => handleConfigChange('global', key, e.target.value)}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                          height: 4,
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                padding: '10px 14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: 8,
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <button
                onClick={copyConfigToClipboard}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: copiedToast ? '#10B981' : 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                }}
              >
                {copiedToast ? '✓ Copied!' : '📋 Copy Values (JSON)'}
              </button>
              <button
                onClick={resetConfig}
                title="Reset to default alignment"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
