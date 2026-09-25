'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Shape presets mapping to the prompt geometry specifications:
 * - Tetrahedron
 * - Octahedron
 * - Icosahedron
 * - TorusKnot (for 4th or alternate)
 */
const SHAPE_CONFIGS = {
  Tetrahedron: {
    color: 0xffb6c1,
    accentHex: '#ec4899',
    createGeometry: () => new THREE.TetrahedronGeometry(2.3, 0)
  },
  Octahedron: {
    color: 0xb2d8d8,
    accentHex: '#06b6d4',
    createGeometry: () => new THREE.OctahedronGeometry(2.2, 0)
  },
  Icosahedron: {
    color: 0xc9a0dc,
    accentHex: '#a855f7',
    createGeometry: () => new THREE.IcosahedronGeometry(2.2, 0)
  },
  TorusKnot: {
    color: 0xfde047,
    accentHex: '#eab308',
    createGeometry: () => new THREE.TorusKnotGeometry(1.5, 0.45, 64, 8)
  }
};

export default function CourseInteractiveCanvas({ shapeName = 'Tetrahedron', isSelected = false }) {
  const mountRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, geometry, standardMaterial, lineMaterial, texture, animationFrameId;

    try {
      const width = container.clientWidth || 340;
      const height = container.clientHeight || 170;

      // Create scene, camera, renderer with safe FOV and distance
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 1000);
      camera.position.z = 6.4;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // Create gradient canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ffcccc');
        gradient.addColorStop(0.2, '#ffe0cc');
        gradient.addColorStop(0.4, '#fff3cc');
        gradient.addColorStop(0.6, '#e6ffcc');
        gradient.addColorStop(0.8, '#ccffeb');
        gradient.addColorStop(1, '#ccccff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        texture = new THREE.CanvasTexture(canvas);
      }

      const cfg = SHAPE_CONFIGS[shapeName] || SHAPE_CONFIGS.Tetrahedron;
      geometry = cfg.createGeometry();

      lineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });

      standardMaterial = new THREE.MeshStandardMaterial({
        color: cfg.color,
        map: texture || null,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(geometry, standardMaterial);
      scene.add(mesh);

      const meshLine = new THREE.Mesh(geometry, lineMaterial);
      const meshLine1 = meshLine.clone();
      const meshLine2 = meshLine.clone();

      const lines = [meshLine, meshLine1, meshLine2];
      lines.forEach((line) => {
        line.material = lineMaterial;
        line.rotation.set(0, 0, 0.6);
        line.scale.set(1.14, 1.14, 1.14);
        scene.add(line);
      });

      // Background floating clones
      const mesh1 = mesh.clone();
      mesh1.position.set(5.5, 1.8, -3);
      mesh1.rotation.set(1, 1, 0);
      mesh1.scale.set(0.48, 0.48, 0.48);
      scene.add(mesh1);

      const mesh2 = mesh.clone();
      mesh2.position.set(-5.5, -1.8, -3);
      mesh2.rotation.set(2, -1, 2);
      mesh2.scale.set(0.48, 0.48, 0.48);
      scene.add(mesh2);

      // Lights
      const pointLight1 = new THREE.PointLight(0xffffff, 1.2);
      pointLight1.position.set(0, 5, 5);
      scene.add(pointLight1);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(0, -1, 3);
      scene.add(dirLight);

      const pointLight2 = new THREE.PointLight(cfg.color, 1.6, 50);
      pointLight2.position.set(10, 10, 10);
      scene.add(pointLight2);

      let mouseX = 0.5;
      let mouseY = 0.5;
      let targetAngleX = 0;
      let targetAngleY = 0;
      let curAngleX = 0;
      let curAngleY = 0;

      const handleMouseMove = (e) => {
        mouseX = e.clientX / (typeof window !== 'undefined' ? window.innerWidth : 1200);
        mouseY = e.clientY / (typeof window !== 'undefined' ? window.innerHeight : 800);
        targetAngleX = -Math.PI / 2 + mouseY * Math.PI;
        targetAngleY = Math.PI * 2 * mouseX;
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
      }

      let autoRotateTime = 0;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        autoRotateTime += 0.01;

        // Smooth lerp towards cursor angles
        curAngleX += (targetAngleX - curAngleX) * 0.08;
        curAngleY += (targetAngleY - curAngleY) * 0.08;

        mesh.rotation.set(curAngleX, curAngleY + Math.sin(autoRotateTime * 0.5) * 0.2, 0.6);

        lines.forEach((line, idx) => {
          const factor = 0.05 - idx * 0.01;
          line.rotation.x += (targetAngleX - line.rotation.x) * factor;
          line.rotation.y += (targetAngleY - line.rotation.y) * factor;
          line.rotation.z = 0.6 + Math.sin(autoRotateTime + idx) * 0.1;
        });

        mesh1.rotation.y += 0.015;
        mesh2.rotation.x += 0.012;

        renderer.render(scene, camera);
      };

      animate();

      // Resize handling
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 340;
        const h = container.clientHeight || 170;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
      }

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (typeof window !== 'undefined') {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
        }
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (renderer) renderer.dispose();
        if (geometry) geometry.dispose();
        if (standardMaterial) standardMaterial.dispose();
        if (lineMaterial) lineMaterial.dispose();
        if (texture) texture.dispose();
      };
    } catch (err) {
      console.warn('WebGL initialization failed, falling back to 2D canvas/svg:', err);
      setWebglError(true);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        try { container.removeChild(renderer.domElement); } catch (_) {}
      }
    }
  }, [shapeName]);

  const cfg = SHAPE_CONFIGS[shapeName] || SHAPE_CONFIGS.Tetrahedron;

  if (webglError) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent'
        }}
      >
        <svg width="90" height="90" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 12px ${cfg.accentHex}88)` }}>
          <polygon
            points="50,15 85,75 15,75"
            fill="none"
            stroke={cfg.accentHex}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          <polygon
            points="50,30 75,70 25,70"
            fill={`${cfg.accentHex}22`}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="50" cy="50" r="12" fill={`${cfg.accentHex}44`} />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '140px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}
    />
  );
}
