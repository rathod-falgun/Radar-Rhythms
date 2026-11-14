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
export default function NisarCinematicEarth({ onExplore, onHowItWorks }) {
  const mountRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
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
    // 2. LIGHTING (Generous ambient light ensures Earth is NEVER dark or black)
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xddeeff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(6, 4, 5); // Sun illumination from upper right
    scene.add(sunLight);

    const limbRimLight = new THREE.DirectionalLight(0x5bc0be, 1.0);
    limbRimLight.position.set(-6, -3, -4);
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
    // Radius = 1.62. Earth fills ~57% of the viewport height with abundant
    // margin on all sides, ensuring a prominent, commanding, unclipped sphere.
    // =========================================================================
    const earthRadius = 1.62;
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5); // 23.5° axial tilt
    scene.add(earthGroup);

    // Earth Sphere Mesh with ultra-high polygon tessellation (256x256)
    // Mathematically eliminates any visible polygon edges or corners at the silhouette
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 256, 256);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: initialTexture,
      specular: new THREE.Color(0x336699),
      shininess: 25,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // Luminous Atmospheric Halo on Planet Silhouette (inspired by reference art)
    const atmoGeometry = new THREE.SphereGeometry(earthRadius * 1.018, 128, 128);
    const atmoMaterial = new THREE.MeshBasicMaterial({
      color: 0x87b8e8,
      transparent: true,
      opacity: 0.16,
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

    // Subtle cyan location pin dot
    const pinGeo = new THREE.SphereGeometry(0.034, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x5bc0be });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    markerGroup.add(pinMesh);

    earthMesh.add(markerGroup);

    // =========================================================================
    // 6. TRUE 3D ORBIT THROUGH MID OF EARTH & REAL NASA NISAR SPACECRAFT
    // Orbit radius X = 2.24, Y = 0.90, Z = 2.12.
    // Sized with wide amplitude and large clearance around the enlarged Earth,
    // carving a sweeping, continuous curve with zero clipping.
    // =========================================================================
    const orbitRadiusX = 2.24;
    const orbitRadiusY = 0.90;
    const orbitRadiusZ = 2.12;

    // Dual Glowing Orbital Ring (Reflective, luminous track inspired by reference design)
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
      color: 0x87b8e8,
      transparent: true,
      opacity: 0.65,
      depthTest: true,
      depthWrite: false,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // Outer subtle metallic sheen track
    const outerTrackPoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const ox = Math.cos(angle) * (orbitRadiusX + 0.03);
      const oy = Math.sin(angle) * (orbitRadiusY + 0.018);
      const oz = Math.sin(angle) * (orbitRadiusZ + 0.03);
      outerTrackPoints.push(new THREE.Vector3(ox, oy, oz));
    }
    const outerTrackGeo = new THREE.BufferGeometry().setFromPoints(outerTrackPoints);
    const outerTrackMat = new THREE.LineBasicMaterial({
      color: 0xc6e9f1,
      transparent: true,
      opacity: 0.35,
      depthTest: true,
      depthWrite: false,
    });
    const outerTrackLine = new THREE.Line(outerTrackGeo, outerTrackMat);
    scene.add(outerTrackLine);

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

      // Orbital Satellite Progression in 3D around the Earth
      if (!isReducedMotion) {
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
      if (!dragRef.current.isDragging && !isReducedMotion) {
        dragRef.current.rotationY += dragRef.current.velocityY;
        dragRef.current.velocityY *= 0.96; // Inertial decay
        if (Math.abs(dragRef.current.velocityY) < 0.0016) {
          dragRef.current.velocityY = 0.0016; // Maintain gentle constant rotation
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
      dragRef.current.velocityY = 0.0016;
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

  const handleResetView = () => {
    if (mountRef.current && mountRef.current.__recenter) {
      mountRef.current.__recenter();
    }
  };

  return (
    <div className="relative w-full max-w-[800px] h-[380px] sm:h-[480px] md:h-[560px] lg:h-[640px] xl:h-[700px] flex items-center justify-center select-none overflow-visible">
      {/* Space Atmospheric Glow with Chambray & Steel Blue */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[560px] md:h-[560px] rounded-full bg-gradient-to-tr from-[#3b4a8c]/40 via-[#587ebb]/20 to-transparent blur-3xl pointer-events-none"></div>
      </div>

      {/* Three.js 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing flex items-center justify-center overflow-visible"
        style={{ touchAction: 'none' }}
      />

      {/* Interactive Controls Overlay */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={handleResetView}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#222950]/80 hover:bg-[#283262] border border-[#587ebb]/50 hover:border-[#87b8e8] text-[#c6e9f1] hover:text-white text-[10px] sm:text-[11px] font-mono flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm backdrop-blur-sm cursor-pointer"
          title="Reset Earth Orientation"
        >
          <span>Recenter South Asia</span>
        </button>
      </div>

      {/* Subtle Drag Hint Pill */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#222950]/70 border border-[#587ebb]/40 text-[9px] sm:text-[10px] font-mono text-[#87b8e8] pointer-events-none backdrop-blur-sm">
        <span>Drag to rotate 3D Earth</span>
      </div>
    </div>
  );
}
