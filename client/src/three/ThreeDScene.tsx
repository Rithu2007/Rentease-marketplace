import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeDScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A0F, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xD4A853, 2.5); // Warm Gold highlight
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 40;
    const d = 15;
    dirLight1.shadow.camera.left = -d;
    dirLight1.shadow.camera.right = d;
    dirLight1.shadow.camera.top = d;
    dirLight1.shadow.camera.bottom = -d;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00D4AA, 1.5); // Teal background glow
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 30);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // --- Shadow-catching Floor Plane ---
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- Starfields (Near, Mid, Far parallax depth layers) ---
    const createStarfield = (count: number, size: number, color: number, rangeZ: [number, number]) => {
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const vels: number[] = [];

      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 50;
        pos[i + 1] = (Math.random() - 0.5) * 50;
        pos[i + 2] = Math.random() * (rangeZ[1] - rangeZ[0]) + rangeZ[0];
        vels.push((Math.random() * 0.012) + 0.003);
      }

      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      
      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: size > 0.15 ? 0.9 : 0.6,
        blending: THREE.AdditiveBlending
      });

      const pts = new THREE.Points(geom, mat);
      scene.add(pts);
      return { geom, pts, vels, count };
    };

    const starsFar = createStarfield(600, 0.06, 0xD4A853, [-25, -10]);
    const starsMid = createStarfield(300, 0.12, 0xD4A853, [-10, 5]);
    const starsNear = createStarfield(100, 0.22, 0x00D4AA, [5, 15]); // Near stars have teal glow

    // --- Custom Furniture Geometry Builders ---
    const createSofa = () => {
      const sofaGroup = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: 0x1A1A24, roughness: 0.6, metalness: 0.1 });
      const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A853, metalness: 0.8, roughness: 0.2 });

      // Base frame
      const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 2), material);
      base.position.y = -0.5;
      sofaGroup.add(base);

      // Backrest
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 0.4), material);
      backrest.position.set(0, 0.2, -0.8);
      sofaGroup.add(backrest);

      // Cushions (Seat)
      for (let i = -1.6; i <= 1.6; i += 1.6) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.6), material);
        cushion.position.set(i, -0.2, 0.1);
        sofaGroup.add(cushion);
      }

      // Armrests
      const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 2), material);
      armLeft.position.set(-2.3, 0.1, 0);
      const armRight = armLeft.clone();
      armRight.position.x = 2.3;
      sofaGroup.add(armLeft, armRight);

      // Gold legs
      for (const [x, z] of [[-2.3, -0.8], [2.3, -0.8], [-2.3, 0.8], [2.3, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 8), goldMaterial);
        leg.position.set(x, -0.85, z);
        sofaGroup.add(leg);
      }

      return sofaGroup;
    };

    const createBed = () => {
      const bedGroup = new THREE.Group();
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 }); // Walnut wood
      const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.8 });
      const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A853, metalness: 0.8, roughness: 0.2 });

      // Bed Frame Base
      const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 5), woodMaterial);
      frame.position.y = -0.4;
      bedGroup.add(frame);

      // Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2, 0.4), woodMaterial);
      headboard.position.set(0, 0.6, -2.3);
      bedGroup.add(headboard);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.6, 4.6), mattressMaterial);
      mattress.position.set(0, 0.1, 0.1);
      bedGroup.add(mattress);

      // Accent gold legs
      for (const [x, z] of [[-2.1, -2.3], [2.1, -2.3], [-2.1, 2.3], [2.1, 2.3]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4, 8), goldMaterial);
        leg.position.set(x, -0.7, z);
        bedGroup.add(leg);
      }

      return bedGroup;
    };

    const createChair = () => {
      const chairGroup = new THREE.Group();
      const seatMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A853, roughness: 0.5 }); // Gold fabric
      const structureMaterial = new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.8, roughness: 0.3 });

      // Seat cushion
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 2), seatMaterial);
      seat.position.y = 0.5;
      chairGroup.add(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(2, 1.8, 0.2), seatMaterial);
      back.position.set(0, 1.4, -0.9);
      chairGroup.add(back);

      // Back supports
      const supportL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), structureMaterial);
      supportL.position.set(-0.8, 1.1, -0.8);
      const supportR = supportL.clone();
      supportR.position.x = 0.8;
      chairGroup.add(supportL, supportR);

      // Legs
      for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 1.3, 8), structureMaterial);
        leg.position.set(x, -0.15, z);
        chairGroup.add(leg);
      }

      return chairGroup;
    };

    // Instantiate and add furniture to the scene
    const sofa = createSofa();
    const bed = createBed();
    const chair = createChair();

    // Enable casting and receiving shadows on all meshes
    const enableShadows = (group: THREE.Group) => {
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };
    enableShadows(sofa);
    enableShadows(bed);
    enableShadows(chair);

    // Set scales and random initial positions
    sofa.scale.set(1.4, 1.4, 1.4);
    bed.scale.set(1.1, 1.1, 1.1);
    chair.scale.set(1.4, 1.4, 1.4);

    scene.add(sofa);
    scene.add(bed);
    scene.add(chair);

    // Initial positioning of floats in coordinate space
    sofa.position.set(-11, 2.5, -5);
    bed.position.set(11, -1.5, -6);
    chair.position.set(-10, -4, -3);

    // Drift metrics with dedicated base positions to keep them spaced apart
    const floats = [
      { mesh: sofa, timeOffset: 0, speed: 0.001, baseX: -11, baseY: 2.5, ampX: 1.2, ampY: 0.8, rotSpeed: 0.003, baseZ: -5 },
      { mesh: bed, timeOffset: Math.PI / 2, speed: 0.0008, baseX: 11, baseY: -1.5, ampX: 1.2, ampY: 0.8, rotSpeed: 0.002, baseZ: -6 },
      { mesh: chair, timeOffset: Math.PI, speed: 0.0012, baseX: -10, baseY: -4.0, ampX: 1.0, ampY: 0.8, rotSpeed: 0.004, baseZ: -3 }
    ];

    // --- Mouse Parallax variables ---
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        mouseX = 0;
        mouseY = 0;
        return;
      }
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation loop ---
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 1. Starfield parallax drift
      const updateStars = (stars: any, speedFactor: number) => {
        const posArr = stars.geom.attributes.position.array as Float32Array;
        for (let i = 0; i < stars.count * 3; i += 3) {
          posArr[i + 1] -= stars.vels[i / 3] * speedFactor;
          if (posArr[i + 1] < -25) {
            posArr[i + 1] = 25;
            posArr[i] = (Math.random() - 0.5) * 50;
          }
        }
        stars.geom.attributes.position.needsUpdate = true;
        stars.pts.rotation.y = elapsedTime * 0.008 * speedFactor;
      };

      updateStars(starsFar, 0.4);
      updateStars(starsMid, 0.8);
      updateStars(starsNear, 1.5);

      // 2. Furniture drift (Smooth local sine-wave floating paths)
      floats.forEach((f) => {
        const time = elapsedTime + f.timeOffset;
        
        // Sine path movement around local base position
        f.mesh.position.x = f.baseX + Math.sin(time * 0.3) * f.ampX;
        f.mesh.position.y = f.baseY + Math.cos(time * 0.4) * f.ampY;
        
        // Rotating motion
        f.mesh.rotation.y = time * f.rotSpeed * 10;
        f.mesh.rotation.x = Math.sin(time * 0.2) * 0.2;
        f.mesh.rotation.z = Math.cos(time * 0.2) * 0.15;
      });

      // 3. Camera Parallax lerp
      const targetCamX = mouseX * 3.5;
      const targetCamY = -mouseY * 2.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, -5);

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize handler ---
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Dispose materials and geometries
      starsFar.geom.dispose();
      starsFar.pts.material.dispose();
      starsMid.geom.dispose();
      starsMid.pts.material.dispose();
      starsNear.geom.dispose();
      starsNear.pts.material.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      
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

      sofa.traverse(disposeNode);
      bed.traverse(disposeNode);
      chair.traverse(disposeNode);

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
