import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RotateCcw, Box } from 'lucide-react';
import { FACE_COLORS, type FaceName } from '../cube/cubeState';

interface Cube3DProps {
  facelets?: string; // 54 char Kociemba notation string
  size?: number | string;
  showControls?: boolean;
  highlightMove?: string; // e.g. "R", "U'", "F2" to highlight active turning layer
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
  highlightMove,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [useCss3D, setUseCss3D] = useState<boolean>(false);

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
    if (!container || useCss3D) return;

    // Check WebGL support safely
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') ||
                 testCanvas.getContext('webgl') ||
                 testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setUseCss3D(true);
        return;
      }
    } catch {
      setUseCss3D(true);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 280;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
    } catch {
      setUseCss3D(true);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // Renderer setup
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight2.position.set(-5, -10, -7);
    scene.add(dirLight2);

    // Group holding all 27 cubies
    const cubeGroup = new THREE.Group();
    cubeGroup.rotation.x = rotationRef.current.x;
    cubeGroup.rotation.y = rotationRef.current.y;
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    // Create 27 cubies with bevel and materials
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
  }, [useCss3D]);

  // Update sticker colors whenever facelets change
  useEffect(() => {
    if (useCss3D || !facelets || facelets.length !== 54 || cubiesRef.current.length === 0) return;

    const getFaceColor = (faceNameChar: string) => {
      const faceName = (faceNameChar as FaceName) || 'U';
      return THREE_FACE_COLORS[faceName] ?? 0xFFFFFF;
    };

    const findCubie = (x: number, y: number, z: number) => {
      const idx = cubiesRef.current.findIndex(
        c => c.userData.x === x && c.userData.y === y && c.userData.z === z
      );
      if (idx !== -1) {
        return { mesh: cubiesRef.current[idx], mats: cubieMaterialsRef.current[idx] };
      }
      return null;
    };

    // Reset outer faces
    for (const mats of cubieMaterialsRef.current) {
      for (const m of mats) {
        m.color.setHex(BLACK_INNER_COLOR);
      }
    }

    // U Face (+Y)
    const uCoords = [
      [-1, 1, -1], [0, 1, -1], [1, 1, -1],
      [-1, 1,  0], [0, 1,  0], [1, 1,  0],
      [-1, 1,  1], [0, 1,  1], [1, 1,  1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = uCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[2].color.setHex(getFaceColor(facelets[i]));
    }

    // R Face (+X)
    const rCoords = [
      [1,  1,  1], [1,  1,  0], [1,  1, -1],
      [1,  0,  1], [1,  0,  0], [1,  0, -1],
      [1, -1,  1], [1, -1,  0], [1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = rCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[0].color.setHex(getFaceColor(facelets[9 + i]));
    }

    // F Face (+Z)
    const fCoords = [
      [-1,  1, 1], [0,  1, 1], [1,  1, 1],
      [-1,  0, 1], [0,  0, 1], [1,  0, 1],
      [-1, -1, 1], [0, -1, 1], [1, -1, 1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = fCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[4].color.setHex(getFaceColor(facelets[18 + i]));
    }

    // D Face (-Y)
    const dCoords = [
      [-1, -1,  1], [0, -1,  1], [1, -1,  1],
      [-1, -1,  0], [0, -1,  0], [1, -1,  0],
      [-1, -1, -1], [0, -1, -1], [1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = dCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[3].color.setHex(getFaceColor(facelets[27 + i]));
    }

    // L Face (-X)
    const lCoords = [
      [-1,  1, -1], [-1,  1, 0], [-1,  1, 1],
      [-1,  0, -1], [-1,  0, 0], [-1,  0, 1],
      [-1, -1, -1], [-1, -1, 0], [-1, -1, 1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = lCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[1].color.setHex(getFaceColor(facelets[36 + i]));
    }

    // B Face (-Z)
    const bCoords = [
      [ 1,  1, -1], [ 0,  1, -1], [-1,  1, -1],
      [ 1,  0, -1], [ 0,  0, -1], [-1,  0, -1],
      [ 1, -1, -1], [ 0, -1, -1], [-1, -1, -1]
    ];
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = bCoords[i];
      const cubie = findCubie(x, y, z);
      if (cubie) cubie.mats[5].color.setHex(getFaceColor(facelets[45 + i]));
    }
  }, [facelets, useCss3D]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !cubeGroupRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    rotationRef.current.y += deltaX * 0.01;
    rotationRef.current.x += deltaY * 0.01;
    rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x));

    cubeGroupRef.current.rotation.x = rotationRef.current.x;
    cubeGroupRef.current.rotation.y = rotationRef.current.y;

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${className}`}>
      {/* Three.js Canvas Mount */}
      {!useCss3D && (
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center min-h-[220px]"
        />
      )}

      {/* Pure CSS 3D Cube (ALWAYS a real 3D Cube in perspective, never a 2D net!) */}
      {useCss3D && (
        <CSS3DCube
          facelets={facelets}
          highlightMove={highlightMove}
          className="w-full h-full min-h-[220px]"
        />
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-surface/85 backdrop-blur-md px-2 py-1 rounded-md border border-border text-text-muted text-xs shadow-md">
          {!useCss3D && (
            <button
              onClick={handleResetView}
              title="Reset 3D camera angle"
              className="p-1 hover:text-text hover:bg-surface-elevated rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setUseCss3D(!useCss3D)}
            title={useCss3D ? "Switch to WebGL 3D" : "Switch to CSS 3D"}
            className="p-1 hover:text-text hover:bg-surface-elevated rounded transition-colors flex items-center gap-1"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="text-[10px]">{useCss3D ? 'CSS 3D' : 'WebGL'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Real CSS 3D Cube (True 3D Cube using CSS 3D transforms: perspective + preserve-3d)
// =========================================================================
interface CSS3DCubeProps {
  facelets: string;
  highlightMove?: string;
  className?: string;
}

export const CSS3DCube: React.FC<CSS3DCubeProps> = ({
  facelets,
  highlightMove,
  className = ''
}) => {
  const [rotX, setRotX] = useState(-25);
  const [rotY, setRotY] = useState(45);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setRotY((prev) => prev + dx * 0.7);
    setRotX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.7)));

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const resetView = () => {
    setRotX(-25);
    setRotY(45);
  };

  // Facelet mapping: 54 chars
  // U: 0-8, R: 9-17, F: 18-26, D: 27-35, L: 36-44, B: 45-53
  const faceStickers = useMemo(() => {
    const safeStr = (facelets && facelets.length === 54)
      ? facelets
      : 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

    return {
      U: safeStr.slice(0, 9).split('') as FaceName[],
      R: safeStr.slice(9, 18).split('') as FaceName[],
      F: safeStr.slice(18, 27).split('') as FaceName[],
      D: safeStr.slice(27, 36).split('') as FaceName[],
      L: safeStr.slice(36, 45).split('') as FaceName[],
      B: safeStr.slice(45, 54).split('') as FaceName[],
    };
  }, [facelets]);

  // Which face is being highlighted by the current move?
  const highlightedFace = highlightMove ? highlightMove.charAt(0).toUpperCase() : null;

  // Cube dimensions
  const cubeSize = 135; // px
  const half = cubeSize / 2;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${className}`}
      style={{ perspective: '800px' }}
    >
      {/* 3D Cube Object */}
      <div
        className="relative transition-transform duration-75"
        style={{
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`
        }}
      >
        {/* FRONT FACE (F) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'F' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.F} />
        </div>

        {/* BACK FACE (B) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'B' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `rotateY(180deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.B} />
        </div>

        {/* TOP FACE (U) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'U' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `rotateX(90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.U} />
        </div>

        {/* BOTTOM FACE (D) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'D' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `rotateX(-90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.D} />
        </div>

        {/* LEFT FACE (L) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'L' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `rotateY(-90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.L} />
        </div>

        {/* RIGHT FACE (R) */}
        <div
          className={`absolute inset-0 bg-[#0d121c] p-1.5 rounded-lg border-2 ${
            highlightedFace === 'R' ? 'border-primary ring-4 ring-primary/40 animate-pulse' : 'border-[#1b2537]'
          }`}
          style={{
            transform: `rotateY(90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <FaceGrid stickers={faceStickers.R} />
        </div>
      </div>

      {/* Reset button inside CSS 3D */}
      <button
        onClick={resetView}
        title="Reset 3D angle"
        className="absolute top-2 right-2 p-1 bg-surface/80 hover:bg-surface-elevated text-text-muted hover:text-text border border-border rounded-md text-xs transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// 3x3 Face Grid of glossy stickers
const FaceGrid: React.FC<{ stickers: FaceName[] }> = ({ stickers }) => {
  return (
    <div className="w-full h-full grid grid-cols-3 gap-1.5">
      {stickers.map((faceCode, idx) => {
        const bg = FACE_COLORS[faceCode] || '#666';
        return (
          <div
            key={idx}
            className="w-full h-full rounded-[4px] shadow-sm relative overflow-hidden transition-colors"
            style={{
              backgroundColor: bg,
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            {/* Subtle gloss highlight on stickers */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/15 rounded-t-[4px] pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};
