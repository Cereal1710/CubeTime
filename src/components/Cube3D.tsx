import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, ShieldAlert } from 'lucide-react';
import { FACE_COLORS, type FaceName } from '../cube/cubeState';

interface Cube3DProps {
  facelets?: string; // 54 char Kociemba notation string
  size?: number | string;
  showControls?: boolean;
  className?: string;
}

// Color map for Three.js
const THREE_FACE_COLORS: Record<FaceName, number> = {
  U: 0xFFFFFF, // White
  D: 0xFFD500, // Yellow
  F: 0x009B48, // Green
  B: 0x0046AD, // Blue
  L: 0xFF5800, // Orange
  R: 0xB71234, // Red
};

const BLACK_INNER_COLOR = 0x181F2C;

export const Cube3D: React.FC<Cube3DProps> = ({
  facelets = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB',
  showControls = true,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [is2DMode, setIs2DMode] = useState(false);

  // References for Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubiesRef = useRef<THREE.Mesh[]>([]);
  const cubieMaterialsRef = useRef<THREE.MeshStandardMaterial[][]>([]);

  // Camera rotation state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.45, y: -0.65 });

  // Reset camera view
  const handleResetView = () => {
    rotationRef.current = { x: 0.45, y: -0.65 };
    if (cubeGroupRef.current) {
      cubeGroupRef.current.rotation.x = 0.45;
      cubeGroupRef.current.rotation.y = -0.65;
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        setIs2DMode(true);
        return;
      }
    } catch {
      setWebGlSupported(false);
      setIs2DMode(true);
      return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-5, -10, -7);
    scene.add(dirLight2);

    // Group holding all 27 cubies
    const cubeGroup = new THREE.Group();
    cubeGroup.rotation.x = rotationRef.current.x;
    cubeGroup.rotation.y = rotationRef.current.y;
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    // Create 27 cubies
    // Three.js BoxGeometry face material indices:
    // 0: +X (Right)
    // 1: -X (Left)
    // 2: +Y (Top / Up)
    // 3: -Y (Bottom / Down)
    // 4: +Z (Front)
    // 5: -Z (Back)
    const cubieGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const cubies: THREE.Mesh[] = [];
    const materialsList: THREE.MeshStandardMaterial[][] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials: THREE.MeshStandardMaterial[] = [];
          for (let f = 0; f < 6; f++) {
            materials.push(
              new THREE.MeshStandardMaterial({
                color: BLACK_INNER_COLOR,
                roughness: 0.25,
                metalness: 0.1,
              })
            );
          }

          const cubie = new THREE.Mesh(cubieGeo, materials);
          cubie.position.set(x, y, z);
          cubie.userData = { x, y, z };
          cubeGroup.add(cubie);
          cubies.push(cubie);
          materialsList.push(materials);
        }
      }
    }

    cubiesRef.current = cubies;
    cubieMaterialsRef.current = materialsList;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      cubieGeo.dispose();
      materialsList.flat().forEach(m => m.dispose());
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update sticker colors whenever facelets change
  useEffect(() => {
    if (!facelets || facelets.length !== 54 || cubiesRef.current.length === 0) return;

    // Facelet string format:
    // U: 0-8, R: 9-17, F: 18-26, D: 27-35, L: 36-44, B: 45-53
    const getFaceColor = (faceNameChar: string) => {
      const faceName = (faceNameChar as FaceName) || 'U';
      return THREE_FACE_COLORS[faceName] ?? 0xFFFFFF;
    };

    // Helper to find cubie mesh by its (x, y, z) coordinate
    const findCubie = (x: number, y: number, z: number) => {
      const idx = cubiesRef.current.findIndex(
        c => c.userData.x === x && c.userData.y === y && c.userData.z === z
      );
      if (idx !== -1) {
        return { mesh: cubiesRef.current[idx], mats: cubieMaterialsRef.current[idx] };
      }
      return null;
    };

    // 1. Reset all outer faces to black first
    for (const mats of cubieMaterialsRef.current) {
      for (const m of mats) {
        m.color.setHex(BLACK_INNER_COLOR);
      }
    }

    // 2. Up Face (+Y, index 2)
    // U0: (-1, 1, -1), U1: (0, 1, -1), U2: (1, 1, -1)
    // U3: (-1, 1, 0),  U4: (0, 1, 0),  U5: (1, 1, 0)
    // U6: (-1, 1, 1),  U7: (0, 1, 1),  U8: (1, 1, 1)
    const uCoords = [
      [-1, 1, -1], [0, 1, -1], [1, 1, -1],
      [-1, 1,  0], [0, 1,  0], [1, 1,  0],
      [-1, 1,  1], [0, 1,  1], [1, 1,  1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = uCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[2].color.setHex(getFaceColor(facelets[i]));
      }
    }

    // 3. Right Face (+X, index 0)
    // R0: (1, 1, 1), R1: (1, 1, 0), R2: (1, 1, -1)
    // R3: (1, 0, 1), R4: (1, 0, 0), R5: (1, 0, -1)
    // R6: (1, -1, 1), R7: (1, -1, 0), R8: (1, -1, -1)
    const rCoords = [
      [1,  1,  1], [1,  1,  0], [1,  1, -1],
      [1,  0,  1], [1,  0,  0], [1,  0, -1],
      [1, -1,  1], [1, -1,  0], [1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = rCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[0].color.setHex(getFaceColor(facelets[9 + i]));
      }
    }

    // 4. Front Face (+Z, index 4)
    // F0: (-1, 1, 1), F1: (0, 1, 1), F2: (1, 1, 1)
    // F3: (-1, 0, 1), F4: (0, 0, 1), F5: (1, 0, 1)
    // F6: (-1, -1, 1), F7: (0, -1, 1), F8: (1, -1, 1)
    const fCoords = [
      [-1,  1, 1], [0,  1, 1], [1,  1, 1],
      [-1,  0, 1], [0,  0, 1], [1,  0, 1],
      [-1, -1, 1], [0, -1, 1], [1, -1, 1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = fCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[4].color.setHex(getFaceColor(facelets[18 + i]));
      }
    }

    // 5. Down Face (-Y, index 3)
    // D0: (-1, -1, 1), D1: (0, -1, 1), D2: (1, -1, 1)
    // D3: (-1, -1, 0), D4: (0, -1, 0), D5: (1, -1, 0)
    // D6: (-1, -1, -1), D7: (0, -1, -1), D8: (1, -1, -1)
    const dCoords = [
      [-1, -1,  1], [0, -1,  1], [1, -1,  1],
      [-1, -1,  0], [0, -1,  0], [1, -1,  0],
      [-1, -1, -1], [0, -1, -1], [1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = dCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[3].color.setHex(getFaceColor(facelets[27 + i]));
      }
    }

    // 6. Left Face (-X, index 1)
    // L0: (-1, 1, -1), L1: (-1, 1, 0), L2: (-1, 1, 1)
    // L3: (-1, 0, -1), L4: (-1, 0, 0), L5: (-1, 0, 1)
    // L6: (-1, -1, -1), L7: (-1, -1, 0), L8: (-1, -1, 1)
    const lCoords = [
      [-1,  1, -1], [-1,  1, 0], [-1,  1, 1],
      [-1,  0, -1], [-1,  0, 0], [-1,  0, 1],
      [-1, -1, -1], [-1, -1, 0], [-1, -1, 1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = lCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[1].color.setHex(getFaceColor(facelets[36 + i]));
      }
    }

    // 7. Back Face (-Z, index 5)
    // B0: (1, 1, -1), B1: (0, 1, -1), B2: (-1, 1, -1)
    // B3: (1, 0, -1), B4: (0, 0, -1), B5: (-1, 0, -1)
    // B6: (1, -1, -1), B7: (0, -1, -1), B8: (-1, -1, -1)
    const bCoords = [
      [ 1,  1, -1], [ 0,  1, -1], [-1,  1, -1],
      [ 1,  0, -1], [ 0,  0, -1], [-1,  0, -1],
      [ 1, -1, -1], [ 0, -1, -1], [-1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = bCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) {
        cubie.mats[5].color.setHex(getFaceColor(facelets[45 + i]));
      }
    }
  }, [facelets]);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !cubeGroupRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    rotationRef.current.y += deltaX * 0.01;
    rotationRef.current.x += deltaY * 0.01;

    // Limit X axis rotation to avoid flipping upside-down
    rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x));

    cubeGroupRef.current.rotation.x = rotationRef.current.x;
    cubeGroupRef.current.rotation.y = rotationRef.current.y;

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // 2D Net Renderer Fallback
  const netFaces = useMemo(() => {
    if (!facelets || facelets.length !== 54) return null;
    return {
      U: facelets.slice(0, 9).split(''),
      R: facelets.slice(9, 18).split(''),
      F: facelets.slice(18, 27).split(''),
      D: facelets.slice(27, 36).split(''),
      L: facelets.slice(36, 45).split(''),
      B: facelets.slice(45, 54).split(''),
    };
  }, [facelets]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${className}`}>
      {/* 3D Canvas Mount */}
      {!is2DMode && (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center min-h-[220px]"
        />
      )}

      {/* 2D Flat Net Preview */}
      {is2DMode && netFaces && (
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-surface rounded-lg border border-border">
            {/* Row 1: Up face */}
            <div className="col-start-2">
              <MiniFace facelets={netFaces.U} />
            </div>

            {/* Row 2: Left, Front, Right, Back */}
            <div className="col-start-1 row-start-2">
              <MiniFace facelets={netFaces.L} />
            </div>
            <div className="col-start-2 row-start-2">
              <MiniFace facelets={netFaces.F} />
            </div>
            <div className="col-start-3 row-start-2">
              <MiniFace facelets={netFaces.R} />
            </div>
            <div className="col-start-4 row-start-2">
              <MiniFace facelets={netFaces.B} />
            </div>

            {/* Row 3: Down face */}
            <div className="col-start-2 row-start-3">
              <MiniFace facelets={netFaces.D} />
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {showControls && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-surface/80 backdrop-blur-md px-2 py-1 rounded-md border border-border text-text-muted text-xs">
          {!is2DMode && (
            <button
              onClick={handleResetView}
              title="Reset camera view"
              className="p-1 hover:text-text hover:bg-surface-elevated rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {webGlSupported && (
            <button
              onClick={() => setIs2DMode(!is2DMode)}
              title={is2DMode ? 'Switch to 3D View' : 'Switch to 2D Net View'}
              className="p-1 hover:text-text hover:bg-surface-elevated rounded transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {!webGlSupported && (
        <div className="absolute top-2 left-2 flex items-center gap-1 text-[11px] text-warning bg-surface/90 px-2 py-0.5 rounded border border-warning/30">
          <ShieldAlert className="w-3 h-3" /> 2D Fallback
        </div>
      )}
    </div>
  );
};

// Mini 3x3 face representation for 2D net view
const MiniFace: React.FC<{ facelets: string[] }> = ({ facelets }) => {
  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-black/40 rounded">
      {facelets.map((f, i) => (
        <div
          key={i}
          className="w-3.5 h-3.5 rounded-[2px]"
          style={{ backgroundColor: FACE_COLORS[f as FaceName] || '#666' }}
        />
      ))}
    </div>
  );
};

