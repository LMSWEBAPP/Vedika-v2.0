'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export class ParticlesSwarm {
  constructor(canvas, count = 13000, initialTransform) {
    this.count = count;
    this.canvas = canvas;
    this.speedMult = 0.85;

    const width = canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth);
    const height = canvas.clientHeight || (canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight);

    // SCENE & CAMERA (100% transparent background)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / (height || 1), 0.1, 2000);
    this.camera.position.set(0, 0, 110);

    // RENDERER - Pure alpha, completely transparent
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Container Group for 60fps real-time positioning, scaling, and rotating
    this.swarmGroup = new THREE.Group();
    this.scene.add(this.swarmGroup);

    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.target = new THREE.Vector3();

    // Sharp tetrahedron geometry for crystalline quantum and disco stardust
    this.geometry = new THREE.TetrahedronGeometry(0.30);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.swarmGroup.add(this.mesh);

    this.positions = [];
    this.particlePhases = new Float32Array(this.count);
    this.particleScales = new Float32Array(this.count);
    this.isDiscoDust = new Uint8Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );

      this.particlePhases[i] = Math.random() * Math.PI * 2;

      // Designate ~28% as Sparkling Golden Disco Dust
      const isDisco = i % 7 === 0 || i % 7 === 3 || i >= 10500;
      this.isDiscoDust[i] = isDisco ? 1 : 0;

      // Particle scale: disco dust sparkles slightly larger on flash
      this.particleScales[i] = isDisco
        ? 0.75 + Math.random() * 0.5
        : 0.35 + Math.random() * 0.35;

      this.mesh.setColorAt(i, this.color.setHex(isDisco ? 0xffd700 : 0x00c2ff));
    }

    // Default transform
    const defaultTransform = {
      posX: 6,
      posY: 15,
      posZ: -31,
      scale: 1,
      rotX: 115,
      rotY: 5,
      rotZ: -40,
    };
    this.updateTransform(initialTransform || defaultTransform);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.onResizeBound = this.onResize.bind(this);
    window.addEventListener('resize', this.onResizeBound);

    this.animate();
  }

  updateTransform(t) {
    if (!this.swarmGroup) return;
    const px = t?.posX ?? 6;
    const py = t?.posY ?? 15;
    const pz = t?.posZ ?? -31;
    const s = t?.scale ?? 1.0;
    const rx = ((t?.rotX ?? 115) * Math.PI) / 180;
    const ry = ((t?.rotY ?? 5) * Math.PI) / 180;
    const rz = ((t?.rotZ ?? -40) * Math.PI) / 180;

    this.swarmGroup.position.set(px, py, pz);
    this.swarmGroup.scale.set(s, s, s);
    this.swarmGroup.rotation.set(rx, ry, rz);
  }

  onResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth || canvasParentWidth(this.canvas);
    const height = this.canvas.clientHeight || canvasParentHeight(this.canvas);
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime() * this.speedMult;

    // Mathematical simulation: expanded to 16 concentric lanes for heavy, dense rings
    const s = 50;
    const v = 0.8;
    const h = 1.0;
    const r = 0.8;
    const d = 1.0;

    const n = Math.max(1, this.count);
    const tau = 6.283185307179586;
    const TOTAL_LANES = 16;
    const rows = Math.max(1, Math.ceil(n / TOTAL_LANES));
    const t = time * v;
    const dt = time * (0.8 + d);

    for (let i = 0; i < this.count; i++) {
      const target = this.target;
      const color = this.color;
      const phase = this.particlePhases[i];
      const isDisco = this.isDiscoDust[i] === 1;

      const lane = i % TOTAL_LANES;
      const row = (i - lane) / TOTAL_LANES;

      // Heavy multi-shell concentric rings
      const shell = lane % 3;
      const tube = s * (0.045 + 0.02 * h) * (0.88 + shell * 0.32);
      const dr = s * (0.17 + 0.03 * r) * (0.85 + shell * 0.28);

      const dataMask = Math.min(1, Math.floor(lane / 12));
      const energyMask = 1.0 - dataMask;

      const u0 = (row + 0.5) / rows + t * 0.04;
      const u = u0 - Math.floor(u0);
      const a = u * tau;

      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const c2 = Math.cos(a * 2.0);
      const s2 = Math.sin(a * 2.0);

      const top = 0.5 * (sa + Math.abs(sa));
      const bottom = 0.5 * (-sa + Math.abs(sa));

      const cx = s * (1.15 * ca + 0.08 * c2);
      const cy = s * (0.42 * top - 0.28 * bottom + 0.03 * s2);
      const cz = s * 0.72 * sa;

      const lu = (lane + 0.5) / TOTAL_LANES;

      const spin = lu * tau * 2.0 + a * (1.4 + r * 0.5) - t * (1.2 + h * 0.15);

      const cs = Math.cos(spin);
      const ss = Math.sin(spin);

      const wave = s * 0.012 * Math.sin(a * 6.0 - t * 2.0 + spin);

      const ex = cx + ca * tube * cs - sa * tube * 0.3 * ss;
      const ey = cy + tube * ss + wave;
      const ez = cz + sa * tube * cs + ca * tube * 0.3 * ss;

      const ds = lu * tau * 3.0 + a * (3.0 + d) - dt * 1.5;

      const dc = Math.cos(ds);
      const dn = Math.sin(ds);

      const dx = cx + ca * dr + ca * tube * 0.5 * dc;
      const dy = cy + s * 0.16 + dr * 0.35 * dn;
      const dz = cz + sa * dr + sa * tube * 0.5 * dc;

      // Micro-flutter for golden disco dust floating around the heavy rings
      let discoScatterX = 0;
      let discoScatterY = 0;
      let discoScatterZ = 0;
      if (isDisco) {
        discoScatterX = Math.sin(phase + time * 1.4) * 2.5;
        discoScatterY = Math.cos(phase * 1.3 + time * 1.1) * 2.5;
        discoScatterZ = Math.sin(phase * 0.8 + time * 1.8) * 3.0;
      }

      const x = ex * energyMask + dx * dataMask + discoScatterX;
      const y = ey * energyMask + dy * dataMask + discoScatterY;
      const z = ez * energyMask + dz * dataMask + discoScatterZ;

      target.set(x, y, z);

      const pulse = 0.5 + 0.5 * Math.sin(a * 3.0 - t * 1.8);

      let hue;
      let sat;
      let light;

      if (isDisco) {
        // GOLDEN DISCO DUST EFFECT
        const discoTwinkle = Math.sin(time * 7.5 + phase * 2.5);
        const sparkle = Math.pow(Math.max(0, discoTwinkle), 4.5);

        hue = 0.118 + 0.015 * Math.sin(phase + time);
        sat = 0.98;
        light = 0.52 + 0.42 * sparkle;
      } else {
        // 4 LAB THEME COLORS
        const labCategory = lane % 4;

        if (labCategory === 0) {
          hue = 0.77 + 0.04 * (0.5 + 0.5 * Math.sin(a * 2.0 + t));
        } else if (labCategory === 1) {
          hue = 0.54 + 0.03 * (0.5 + 0.5 * dn);
        } else if (labCategory === 2) {
          hue = 0.42 + 0.03 * (0.5 + 0.5 * ca);
        } else {
          hue = 0.10 + 0.03 * (0.5 + 0.5 * sa);
        }

        sat = energyMask * (0.94 + 0.06 * pulse) + dataMask * 0.98;
        light = energyMask * (0.42 + 0.28 * pulse) + dataMask * (0.55 + 0.22 * (0.5 + 0.5 * dn));
      }

      color.setHSL(
        Math.max(0, Math.min(1, hue % 1)),
        Math.max(0, Math.min(1, sat)),
        Math.max(0, Math.min(1, light))
      );

      // UPDATE POSITION & SCALE
      this.positions[i].lerp(this.target, 0.12);
      this.dummy.position.copy(this.positions[i]);

      let currentScale = this.particleScales[i];
      if (isDisco) {
        const discoTwinkle = Math.sin(time * 7.5 + phase * 2.5);
        const sparkle = Math.pow(Math.max(0, discoTwinkle), 4.5);
        currentScale *= 0.85 + 0.95 * sparkle;
      }
      this.dummy.scale.set(currentScale, currentScale, currentScale);

      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeBound);
    }
    try {
      this.geometry?.dispose();
      this.material?.dispose();
      if (this.mesh && this.swarmGroup) {
        this.swarmGroup.remove(this.mesh);
      }
      this.renderer?.dispose();
    } catch {
      // Safe cleanup
    }
  }
}

function canvasParentWidth(canvas) {
  return canvas.parentElement?.clientWidth || window.innerWidth;
}

function canvasParentHeight(canvas) {
  return canvas.parentElement?.clientHeight || window.innerHeight;
}

export default function ParticlesBackground({
  count = 13000,
  opacity = 0.92,
  posX = 6,
  posY = 15,
  posZ = -31,
  scale = 1.0,
  rotX = 115,
  rotY = 5,
  rotZ = -40,
  className,
  style,
}) {
  const canvasRef = useRef(null);
  const swarmRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const swarm = new ParticlesSwarm(canvas, count, {
      posX,
      posY,
      posZ,
      scale,
      rotX,
      rotY,
      rotZ,
    });
    swarmRef.current = swarm;

    return () => {
      swarm.dispose();
      swarmRef.current = null;
    };
  }, [count]);

  useEffect(() => {
    if (swarmRef.current) {
      swarmRef.current.updateTransform({
        posX,
        posY,
        posZ,
        scale,
        rotX,
        rotY,
        rotZ,
      });
    }
  }, [posX, posY, posZ, scale, rotX, rotY, rotZ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        ...style,
      }}
    />
  );
}
