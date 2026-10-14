import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export function useDrawingSequence(scene) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealedElementIds, setRevealedElementIds] = useState(() => new Set());
  const [drawnConnectorIds, setDrawnConnectorIds] = useState(() => new Set());
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50, visible: false, label: "" });

  const timerRef = useRef(null);
  const steps = useMemo(() => scene?.animationSequence || [], [scene?.animationSequence]);

  // Reset or initialize on scene change
  useEffect(() => {
    if (!scene) {
      setIsPlaying(false);
      setIsCompleted(false);
      setCurrentStepIndex(0);
      setRevealedElementIds(new Set());
      setDrawnConnectorIds(new Set());
      setCursorPosition({ x: 50, y: 50, visible: false, label: "" });
      return;
    }

    if (reducedMotion) {
      const allElems = new Set(scene.elements.map((e) => e.id));
      const allConns = new Set((scene.connectors || []).map((c) => c.id));
      setRevealedElementIds(allElems);
      setDrawnConnectorIds(allConns);
      setIsCompleted(true);
      setIsPlaying(false);
      setCursorPosition({ x: 50, y: 50, visible: false, label: "" });
      return;
    }

    // Auto-start sequence
    setCurrentStepIndex(0);
    setRevealedElementIds(new Set());
    setDrawnConnectorIds(new Set());
    setIsCompleted(false);
    setIsPlaying(true);
  }, [scene, reducedMotion]);

  const applyStep = useCallback((step) => {
    setCursorPosition({
      x: step.cursorAnchor.x,
      y: step.cursorAnchor.y,
      visible: true,
      label: step.label,
    });

    if (step.action === "draw") {
      setDrawnConnectorIds((prev) => new Set([...prev, step.targetId]));
    } else if (step.action === "reveal" || step.action === "fade-in" || step.action === "highlight") {
      setRevealedElementIds((prev) => new Set([...prev, step.targetId]));
    }
  }, []);

  const skipToEnd = useCallback(() => {
    if (!scene) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const allElems = new Set(scene.elements.map((e) => e.id));
    const allConns = new Set((scene.connectors || []).map((c) => c.id));
    setRevealedElementIds(allElems);
    setDrawnConnectorIds(allConns);
    setCurrentStepIndex(steps.length);
    setIsPlaying(false);
    setIsCompleted(true);
    setCursorPosition({ x: 50, y: 50, visible: false, label: "" });
  }, [scene, steps.length]);

  const replay = useCallback(() => {
    if (!scene) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setRevealedElementIds(new Set());
    setDrawnConnectorIds(new Set());
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setIsPlaying(true);
  }, [scene]);

  const play = useCallback(() => {
    if (isCompleted) {
      replay();
    } else {
      setIsPlaying(true);
    }
  }, [isCompleted, replay]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      applyStep(step);
      setCurrentStepIndex((prev) => prev + 1);
      if (currentStepIndex + 1 >= steps.length) {
        setIsCompleted(true);
        setIsPlaying(false);
      }
    }
  }, [currentStepIndex, steps, applyStep]);

  // Stepping loop
  useEffect(() => {
    if (!isPlaying || isCompleted || steps.length === 0) return;

    if (currentStepIndex >= steps.length) {
      setIsCompleted(true);
      setIsPlaying(false);
      setCursorPosition((prev) => ({ ...prev, visible: false }));
      return;
    }

    const currentStep = steps[currentStepIndex];
    applyStep(currentStep);

    const stepDuration = Math.max(120, (currentStep.duration || 600) / speed);

    timerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, stepDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isCompleted, currentStepIndex, steps, speed, applyStep]);

  return {
    isPlaying,
    isCompleted,
    currentStepIndex,
    totalSteps: steps.length,
    currentStep: steps[currentStepIndex],
    cursorPosition,
    revealedElementIds,
    drawnConnectorIds,
    speed,
    reducedMotion,
    play,
    pause,
    replay,
    skipToEnd,
    stepForward,
    setSpeed,
    setReducedMotion,
  };
}
