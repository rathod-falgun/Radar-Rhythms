import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Satellite, Compass, RefreshCw } from 'lucide-react';

/**
 * NisarCinematicEarth
 *
 * True 3D Photorealistic Earth Globe with Real NASA-ISRO NISAR Spacecraft in Orbit:
 * - Built with Three.js WebGL rendering engine
 * - 100% Fully Curved Spherical Earth with generous viewport padding (zero clipped edges)
 * - NASA Blue Marble photorealistic texture, axial tilt (23.5°), and specular ocean reflections
 * - Real official NASA/ISRO NISAR spacecraft model orbiting visibly through the middle of the Earth
 * - True 3D depth occlusion: spacecraft swings in front of the middle of the globe (fully visible & prominent)
 *   and naturally passes behind the planet
 * - Subtle 3D orbital trajectory ring indicating the satellite's orbital plane
 * - Interactive mouse/touch dragging with smooth inertial damping
 */
export default function NisarCinematicEarth({ onExplore, onHowItWorks, motionPaused = false }) {
  const mountRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const autoRotateRef = useRef(true);
  const motionPausedRef = useRef(motionPaused);

  useEffect(() => {
    motionPausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => {
    autoRotateRef.current = isAutoRotating;
  }, [isAutoRotating]);

  const dragRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotationY: 4.65, // Faces South Asia / India / Brahmaputra initially
    rotationX: 0.1,
    velocityY: 0.0016,
    velocityX: 0,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 600;

    // =========================================================================
    // 1. THREE.JS SCENE, CAMERA & RENDERER SETUP
    // Camera positioned at z=7.3 with responsive FOV.
    // Earth radius is 1.62, giving an impressive, rich, screen-filling globe
    // that fits comfortably within the viewport with smooth responsive clearance.
    // =========================================================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.3);

    const updateCameraProjection = (w, h) => {
      const aspect = w / h;
      camera.aspect = aspect;
      const baseFov = 42;
      // Dynamic FOV compensation for mobile & portrait devices
      // Ensures Earth & orbit are prominent, magnificent, and fit the screen without touching edges
      if (aspect < 1.15) {
        const targetHFov = THREE.MathUtils.degToRad(baseFov * 1.15);
        const vFovRad = 2 * Math.atan(Math.tan(targetHFov / 2) / aspect);
        camera.fov = THREE.MathUtils.radToDeg(vFovRad);
      } else {
        camera.fov = baseFov;
      }
      camera.updateProjectionMatrix();
    };

    updateCameraProjection(width, height);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // 2. LIGHTING (Upper-left sunlight: lit side is warm, dark side falls into black)
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0x0a1226, 0.22);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 3.4);
    sunLight.position.set(-7, 6, 4.5); // Sun illumination from upper left
    scene.add(sunLight);

    const limbRimLight = new THREE.DirectionalLight(0xfca311, 1.3);
    limbRimLight.position.set(-6, 5, -2);
    scene.add(limbRimLight);

    // =========================================================================
    // 3. VIBRANT PROCEDURAL FALLBACK TEXTURE (Immediate display while image loads)
    // =========================================================================
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 2048;
    fallbackCanvas.height = 1024;
    const fCtx = fallbackCanvas.getContext('2d');

    // Vibrant deep blue ocean
    const oceanGrad = fCtx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0F2C59');
    oceanGrad.addColorStop(0.35, '#155296');
    oceanGrad.addColorStop(0.5, '#1B65B5');
    oceanGrad.addColorStop(0.65, '#155296');
    oceanGrad.addColorStop(1, '#0F2C59');
    fCtx.fillStyle = oceanGrad;
    fCtx.fillRect(0, 0, 2048, 1024);

    // Continent helper
    const toXY = (lat, lon) => [((lon + 180) / 360) * 2048, ((90 - lat) / 180) * 1024];

    // Continents in realistic lush green and plateau brown
    fCtx.fillStyle = '#2D6A4F';
    fCtx.beginPath();
    [[35, 74], [34, 78], [30, 81], [27, 88], [28, 97], [24, 94], [22, 90], [21, 87], [16, 82], [11, 80], [8, 77.5], [10, 76], [15, 73.5], [19, 72.8], [23, 69], [25, 67], [30, 70]].forEach(([lat, lon], idx) => {
      const [x, y] = toXY(lat, lon);
      if (idx === 0) fCtx.moveTo(x, y); else fCtx.lineTo(x, y);
    });
    fCtx.closePath();
    fCtx.fill();

    fCtx.fillStyle = '#52796F';
    fCtx.beginPath();
    [[35, 74], [40, 70], [50, 60], [60, 50], [70, 40], [72, 80], [75, 120], [70, 160], [60, 170], [50, 140], [40, 130], [30, 122], [22, 114], [20, 105], [15, 100], [22, 90], [28, 97], [27, 88], [30, 81], [34, 78]].forEach(([lat, lon], idx) => {
      const [x, y] = toXY(lat, lon);
      if (idx === 0) fCtx.moveTo(x, y); else fCtx.lineTo(x, y);
    });
    fCtx.closePath();
    fCtx.fill();

    // Polar ice caps
    fCtx.fillStyle = '#FFFFFF';
    fCtx.fillRect(0, 0, 2048, 90);
    fCtx.fillRect(0, 934, 2048, 90);

    const initialTexture = new THREE.CanvasTexture(fallbackCanvas);

    // =========================================================================
    // 4. 3D EARTH GLOBE
    // Radius = 1.90. Earth fills top-right quadrant with rich commanding presence
    // while maintaining smooth clearance from boundaries.
    // =========================================================================
    const earthRadius = 1.90;
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, 0); // Centered cleanly in fit manner
    earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5); // 23.5° axial tilt
    scene.add(earthGroup);

    // Earth Sphere Mesh with ultra-high polygon tessellation (256x256)
    // Mathematically eliminates any visible polygon edges or corners at the silhouette
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 256, 256);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: initialTexture,
      specular: new THREE.Color(0xfca311),
      shininess: 18,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // Luminous Atmospheric Halo on Planet Silhouette
    const atmoGeometry = new THREE.SphereGeometry(earthRadius * 1.018, 128, 128);
    const atmoMaterial = new THREE.MeshBasicMaterial({
      color: 0xfca311,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    earthGroup.add(atmoMesh);

    // Load NASA Blue Marble 2K Photo Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/earth_daymap.jpg',
      (photoTexture) => {
        photoTexture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = photoTexture;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      (err) => console.warn('Using procedural Earth texture:', err)
    );

    // =========================================================================
    // 5. BRAHMAPUTRA REACH 3D TARGET MARKER (26.9°N, 94.1°E)
    // =========================================================================
    const lat = 26.9;
    const lon = 94.1;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const markerRadius = earthRadius * 1.012;
    const mx = -markerRadius * Math.sin(phi) * Math.cos(theta);
    const my = markerRadius * Math.cos(phi);
    const mz = markerRadius * Math.sin(phi) * Math.sin(theta);

    const markerGroup = new THREE.Group();
    markerGroup.position.set(mx, my, mz);

    // Target pin: subtle orange beacon dot
    const pinGeo = new THREE.SphereGeometry(0.034, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xfca311 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    markerGroup.add(pinMesh);

    earthMesh.add(markerGroup);

    // =========================================================================
    // 6. TRUE 3D ORBIT THROUGH MID OF EARTH & REAL NASA NISAR SPACECRAFT
    // Orbit radius X = 2.24, Y = 0.90, Z = 2.12.
    // Pure night-pass radar aesthetic: thin orange orbit ring on pure black.
    // =========================================================================
    const orbitCenterX = 0;
    const orbitRadiusX = 2.65;
    const orbitRadiusY = 1.05;
    const orbitRadiusZ = 2.50;

    // Single Thin Orange Orbit Ring
    const orbitPoints = [];
    const segments = 192;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const ox = Math.cos(angle) * orbitRadiusX;
      const oy = Math.sin(angle) * orbitRadiusY;
      const oz = Math.sin(angle) * orbitRadiusZ;
      orbitPoints.push(new THREE.Vector3(ox, oy, oz));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xfca311,
      transparent: true,
      opacity: 0.75,
      depthTest: true,
      depthWrite: false,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // Real NASA-ISRO NISAR Spacecraft in Orbit
    const satelliteTexture = textureLoader.load('/assets/nisar_satellite.png');
    satelliteTexture.colorSpace = THREE.SRGBColorSpace;

    // depthWrite: false and alphaTest: 0.1 completely eliminate any square/box bounding artifacts
    const satelliteMaterial = new THREE.SpriteMaterial({
      map: satelliteTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      alphaTest: 0.1,
    });
    const satelliteSprite = new THREE.Sprite(satelliteMaterial);

    // Native aspect ratio of nisar_satellite.png is 531 / 915 = 0.58
    // Large, sharp, and commanding presence
    const satBaseWidth = 0.82;
    const satBaseHeight = satBaseWidth / 0.58; // approx 1.41
    satelliteSprite.scale.set(satBaseWidth, satBaseHeight, 1);
    scene.add(satelliteSprite);

    // =========================================================================
    // 7. DRAG TO ROTATE & INERTIAL DAMPING CONTROLS
    // =========================================================================
    const handleStart = (clientX, clientY) => {
      dragRef.current.isDragging = true;
      dragRef.current.prevX = clientX;
      dragRef.current.prevY = clientY;
      dragRef.current.velocityX = 0;
      dragRef.current.velocityY = 0;
    };

    const handleMove = (clientX, clientY) => {
      if (!dragRef.current.isDragging) return;
      const dx = clientX - dragRef.current.prevX;
      const dy = clientY - dragRef.current.prevY;
      dragRef.current.rotationY += dx * 0.005;
      dragRef.current.rotationX = Math.max(-0.6, Math.min(0.6, dragRef.current.rotationX + dy * 0.005));
      dragRef.current.velocityY = dx * 0.003;
      dragRef.current.velocityX = dy * 0.003;
      dragRef.current.prevX = clientX;
      dragRef.current.prevY = clientY;
    };

    const handleEnd = () => {
      dragRef.current.isDragging = false;
    };

    const onMouseDown = (e) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    const onTouchStart = (e) => {
      if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // =========================================================================
    // 8. ANIMATION LOOP (Orbit progression + Earth rotation)
    // =========================================================================
    let animId;
    let satAngle = Math.PI / 2; // Starts in front of the middle of the Earth

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const shouldAnimate = !isReducedMotion && !motionPausedRef.current;

      // Orbital Satellite Progression in 3D around the Earth
      if (shouldAnimate) {
        satAngle += 0.0075;
      }

      // 3D Orbital Coordinates: turning around Earth in a wide, sweeping, perfect curve
      const satX = Math.cos(satAngle) * orbitRadiusX;
      const satY = Math.sin(satAngle) * orbitRadiusY;
      const satZ = Math.sin(satAngle) * orbitRadiusZ;
      satelliteSprite.position.set(satX, satY, satZ);

      // Natural gentle flight banking as it sweeps along the curve
      satelliteSprite.material.rotation = -Math.cos(satAngle) * 0.22;

      // Realistic 3D depth scaling (larger when in front, smaller when behind)
      const depthScale = THREE.MathUtils.lerp(0.85, 1.18, (satZ + orbitRadiusZ) / (2 * orbitRadiusZ));
      satelliteSprite.scale.set(satBaseWidth * depthScale, satBaseHeight * depthScale, 1);

      // Earth Rotation & Inertia
      if (!dragRef.current.isDragging && shouldAnimate) {
        if (autoRotateRef.current) {
          dragRef.current.rotationY += 0.0022;
        } else {
          dragRef.current.rotationY += dragRef.current.velocityY;
          dragRef.current.velocityY *= 0.94; // Inertial decay
        }
      }

      earthMesh.rotation.y = dragRef.current.rotationY;
      earthGroup.rotation.x = dragRef.current.rotationX;

      renderer.render(scene, camera);
    };

    animate();

    // Robust ResizeObserver for automatic responsive canvas updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          updateCameraProjection(newW, newH);
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Recenter Helper Function
    container.__recenter = () => {
      dragRef.current.rotationY = 4.65;
      dragRef.current.rotationX = 0.1;
      dragRef.current.velocityY = 0;
    };

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isReducedMotion]);

  const handleToggleRotate = () => {
    setIsAutoRotating((prev) => !prev);
    dragRef.current.velocityY = 0.003;
  };

  const handleResetView = () => {
    if (mountRef.current && mountRef.current.__recenter) {
      mountRef.current.__recenter();
    }
  };

  return (
    <div className="relative w-full max-w-[800px] lg:max-w-[860px] h-[360px] sm:h-[420px] md:h-[480px] lg:h-[540px] flex items-center justify-center select-none overflow-visible">
      {/* Pure black background with subtle prussian depth */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#14213d]/25 blur-3xl pointer-events-none"></div>
      </div>

      {/* Three.js 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing flex items-center justify-center overflow-visible"
        style={{ touchAction: 'none' }}
      />

      {/* Interactive Controls Overlay: Rotate 3D Sphere & Recenter Orbit stacked on left */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex flex-col items-start gap-2">
        <button
          onClick={handleToggleRotate}
          className="px-2.5 py-1 rounded bg-[#14213d] hover:bg-[#14213d]/80 border border-[#e5e5e5]/15 hover:border-[#fca311] text-[#e5e5e5] hover:text-white text-[10px] sm:text-[11px] font-mono tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-xs select-none"
          title="Click to toggle automatic 3D rotation"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAutoRotating ? 'bg-[#fca311] animate-pulse' : 'bg-[#e5e5e5]/40'}`}></span>
          <span>Rotate 3D Sphere</span>
        </button>

        <button
          onClick={handleResetView}
          className="px-2.5 py-1 rounded bg-[#14213d] hover:bg-[#14213d]/80 border border-[#e5e5e5]/15 hover:border-[#fca311] text-[#e5e5e5] hover:text-white text-[10px] sm:text-[11px] font-mono tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-xs select-none"
          title="Reset Earth Orientation"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
          <span>Recenter Orbit</span>
        </button>
      </div>
    </div>
  );
}
