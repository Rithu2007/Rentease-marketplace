import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDViewerProps {
  category: string;
  currentColorHex: string;
}

export const ThreeDViewer = ({ category, currentColorHex }: ThreeDViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const targetColorRef = useRef<THREE.Color>(new THREE.Color(currentColorHex));

  // Update target color whenever currentColorHex prop changes
  useEffect(() => {
    targetColorRef.current.set(currentColorHex);
  }, [currentColorHex]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup Scene, Camera, Renderer ---
    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 400;

    const scene = new THREE.Scene();
    // Soft dark gradient background matches app
    scene.background = new THREE.Color(0x111118);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xD4A853, 0.6); // Warm gold fill
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // --- Reflective Floor Plane ---
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0A0A0F,
      roughness: 0.4,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add a grid helper on the floor for visual grounding
    const grid = new THREE.GridHelper(10, 10, 0xD4A853, 0x222230);
    grid.position.y = -0.59;
    scene.add(grid);

    // --- Group to Hold Model (for rotation) ---
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // --- Material ---
    const itemColor = new THREE.Color(currentColorHex);
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: itemColor,
      roughness: 0.5,
      metalness: 0.2,
    });
    materialRef.current = mainMaterial;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A24,
      roughness: 0.6,
    });

    const metallicMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4A853,
      metalness: 0.8,
      roughness: 0.2,
    });

    // --- Build Custom Models based on Category ---
    const catLower = category.toLowerCase();

    if (catLower.includes('sofa')) {
      // Sofa Model
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 1.6), mainMaterial);
      base.position.y = 0.1;
      base.castShadow = true;
      modelGroup.add(base);

      const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 0.3), mainMaterial);
      back.position.set(0, 0.75, -0.65);
      back.castShadow = true;
      modelGroup.add(back);

      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 1.6), mainMaterial);
      armL.position.set(-1.8, 0.5, 0);
      armL.castShadow = true;
      const armR = armL.clone();
      armR.position.x = 1.8;
      modelGroup.add(armL, armR);

      // Cushions
      for (let x = -1.2; x <= 1.2; x += 1.2) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 1.2), accentMaterial);
        cushion.position.set(x, 0.35, 0.1);
        cushion.castShadow = true;
        modelGroup.add(cushion);
      }

      // Legs
      for (const [lx, lz] of [[-1.7, -0.7], [1.7, -0.7], [-1.7, 0.7], [1.7, 0.7]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.4, 8), metallicMaterial);
        leg.position.set(lx, -0.25, lz);
        leg.castShadow = true;
        modelGroup.add(leg);
      }
    } else if (catLower.includes('bed')) {
      // Bed Model
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 4.2), accentMaterial);
      base.position.y = 0.0;
      base.castShadow = true;
      modelGroup.add(base);

      const head = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 0.3), accentMaterial);
      head.position.set(0, 0.8, -2.0);
      head.castShadow = true;
      modelGroup.add(head);

      const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.5, 3.8), mainMaterial);
      mattress.position.set(0, 0.4, 0.1);
      mattress.castShadow = true;
      modelGroup.add(mattress);

      // Pillows
      const pillowL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
      pillowL.position.set(-0.65, 0.7, -1.3);
      pillowL.rotation.x = 0.1;
      const pillowR = pillowL.clone();
      pillowR.position.x = 0.65;
      modelGroup.add(pillowL, pillowR);
    } else if (catLower.includes('chair') || catLower.includes('recliner')) {
      // Chair Model
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.6), mainMaterial);
      seat.position.y = 0.5;
      seat.castShadow = true;
      modelGroup.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.15), mainMaterial);
      back.position.set(0, 1.3, -0.7);
      back.castShadow = true;
      modelGroup.add(back);

      // Frame Legs
      for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.0, 8), metallicMaterial);
        leg.position.set(lx, 0.0, lz);
        leg.castShadow = true;
        modelGroup.add(leg);
      }
    } else if (catLower.includes('dining') || catLower.includes('table') || catLower.includes('desk')) {
      // Table Model
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 2.2), mainMaterial);
      top.position.y = 0.9;
      top.castShadow = true;
      modelGroup.add(top);

      // Table legs
      for (const [lx, lz] of [[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 1.8, 8), metallicMaterial);
        leg.position.set(lx, 0.0, lz);
        leg.castShadow = true;
        modelGroup.add(leg);
      }
    } else if (catLower.includes('wardrobe')) {
      // Wardrobe Model
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 1.2), mainMaterial);
      body.position.y = 1.1;
      body.castShadow = true;
      modelGroup.add(body);

      // Handle accent details
      const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), metallicMaterial);
      handleL.position.set(-0.15, 1.1, 0.62);
      const handleR = handleL.clone();
      handleR.position.x = 0.15;
      modelGroup.add(handleL, handleR);
    } else if (catLower.includes('tv')) {
      // TV Model
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.8), metallicMaterial);
      stand.position.y = -0.4;
      modelGroup.add(stand);

      const support = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), metallicMaterial);
      support.position.y = -0.1;
      modelGroup.add(support);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 0.15), mainMaterial);
      screen.position.y = 1.1;
      screen.castShadow = true;
      modelGroup.add(screen);

      const bezel = new THREE.Mesh(new THREE.BoxGeometry(4.3, 2.5, 0.1), accentMaterial);
      bezel.position.set(0, 1.1, -0.05);
      modelGroup.add(bezel);
    } else if (catLower.includes('washing') || catLower.includes('refrigerator') || catLower.includes('ac')) {
      // Appliance (Washing Machine / Fridge / AC)
      let w = 1.8, h = 2.4, d = 1.8;
      if (catLower.includes('refrigerator')) {
        w = 1.8; h = 3.4; d = 1.8;
      } else if (catLower.includes('ac')) {
        w = 3.2; h = 0.8; d = 0.8;
      }
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mainMaterial);
      body.position.y = h / 2 - 0.5;
      body.castShadow = true;
      modelGroup.add(body);

      // Panel details
      const doorLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.02), metallicMaterial);
      doorLine.position.set(0, h / 2 - 0.5, d / 2 + 0.01);
      modelGroup.add(doorLine);
    } else {
      // Fallback: Convincing bounding box with rounded outline using EdgesGeometry
      const boxGeo = new THREE.BoxGeometry(2, 2, 2);
      const cube = new THREE.Mesh(boxGeo, mainMaterial);
      cube.position.y = 0.5;
      cube.castShadow = true;
      modelGroup.add(cube);

      const edges = new THREE.EdgesGeometry(boxGeo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xD4A853, linewidth: 2 }));
      line.position.y = 0.5;
      modelGroup.add(line);
    }

    // Centering model offset
    modelGroup.position.set(0, 0, 0);

    // --- Interactive Mouse Drag Rotation ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragTime = 0; // Tracks frames since last user drag interaction

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragTime = 0;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      dragTime = 0;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      modelGroup.rotation.y += deltaMove.x * 0.007;
      modelGroup.rotation.x += deltaMove.y * 0.007;

      // Restrict vertical rotation to prevent flipping upside down
      modelGroup.rotation.x = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, modelGroup.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // --- Animation & Rendering Loop ---
    let animationId: number;

    const renderLoop = () => {
      animationId = requestAnimationFrame(renderLoop);

      // Lerp material color over frames towards selected variant hex code
      if (materialRef.current) {
        materialRef.current.color.lerp(targetColorRef.current, 0.1);
      }

      // If user is not interacting, auto-rotate slowly
      if (!isDragging) {
        dragTime++;
        if (dragTime > 120) { // Starts auto rotating 2 seconds after drag ends
          modelGroup.rotation.y += 0.003;
          // Slowly lerp vertical rotation back to level base
          modelGroup.rotation.x += (0 - modelGroup.rotation.x) * 0.05;
        }
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // --- Resize handler ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Clear geometries
      const disposeNode = (node: any) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((mat: any) => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      };

      modelGroup.traverse(disposeNode);
      floor.geometry.dispose();
      floor.material.dispose();
      grid.dispose();

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [category]); // Re-create shape if product category changes

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-borderCard">
      {/* Three.js viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Radial Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(10,10,15,0.85)_100%)]" />
      
      {/* Floating instruction badge */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md border border-borderCard px-4 py-1.5 rounded-full pointer-events-none text-xs text-goldAccent tracking-wide flex items-center gap-2">
        <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3 .5a1.5 1.5 0 003 0M10 12h2a1.5 1.5 0 011.5 1.5v.5M10 12V6a1.5 1.5 0 013 0v6m-3 0h3a1.5 1.5 0 011.5 1.5v.5" />
        </svg>
        <span>Click and drag to rotate 360°</span>
      </div>
    </div>
  );
};
