'use client';
import { useEffect, useRef } from 'react';

// Color map: verdict → laser hex
const VERDICT_COLORS = {
  malicious: 0xef4444,
  suspicious: 0xf59e0b,
  clean:      0x22c55e,
  loading:    0x3b82f6,
  default:    0xffffff,
};

export default function RobotScene({ mode = 'inspect', verdict = null }) {
  const mountRef = useRef(null);

  useEffect(() => {
    let THREE, renderer, animId;

    async function init() {
      THREE = await import('three');

      const W = mountRef.current.clientWidth;
      const H = mountRef.current.clientHeight;

      // ── Renderer ────────────────────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      mountRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b1120);
      scene.fog = new THREE.FogExp2(0x0b1120, 0.06);

      // ── Camera ───────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
      // Robot faces RIGHT (toward card). Camera offset to show profile.
      camera.position.set(-5, 3.5, 9);
      camera.lookAt(0, 1.5, 0);

      // ── Lights ───────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0x0b1120, 0.7));
      const keyLight = new THREE.DirectionalLight(0x3b82f6, 1.2);
      keyLight.position.set(-4, 8, 4);
      keyLight.castShadow = true;
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x1e293b, 0.9, 30);
      fillLight.position.set(4, 3, -3);
      scene.add(fillLight);

      // ── Materials ────────────────────────────────────────────────────────────
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.15,
      });
      const darkMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.1,
      });
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.6,
        roughness: 0.3,
      });

      // Determine laser color
      const laserHex =
        mode === 'inspect'
          ? VERDICT_COLORS.default           // white for inspect
          : VERDICT_COLORS[verdict] ?? VERDICT_COLORS.loading;

      const eyeMat = new THREE.MeshStandardMaterial({
        color: laserHex,
        emissive: new THREE.Color(laserHex),
        emissiveIntensity: 4,
      });
      const beamMat = new THREE.MeshBasicMaterial({
        color: laserHex,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      // ── Robot root ───────────────────────────────────────────────────────────
      const robot = new THREE.Group();
      scene.add(robot);

      // Helper
      const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        return m;
      };
      const cyl = (rt, rb, h, seg, mat, x = 0, y = 0, z = 0) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        return m;
      };

      // ── LEGS (bottom of robot, wide stance matching reference silhouette) ────
      const legL = box(0.5, 1.4, 0.5, bodyMat, -0.45, 0.7, 0);
      const legR = box(0.5, 1.4, 0.5, bodyMat,  0.45, 0.7, 0);
      const footL = box(0.65, 0.22, 0.75, darkMat, -0.45, 0.07, 0.08);
      const footR = box(0.65, 0.22, 0.75, darkMat,  0.45, 0.07, 0.08);
      robot.add(legL, legR, footL, footR);

      // ── TORSO ────────────────────────────────────────────────────────────────
      const torso = box(1.5, 1.6, 0.8, bodyMat, 0, 2.3, 0);
      // Chest panel
      const chestPanel = box(0.9, 0.7, 0.12, panelMat, 0, 2.35, 0.41);
      // Vent lines on chest
      for (let i = 0; i < 3; i++) {
        const vent = box(0.75, 0.055, 0.14, darkMat, 0, 2.55 - i * 0.22, 0.41);
        robot.add(vent);
      }
      // Shoulder connectors (matching wide upper silhouette from reference)
      const shoulderL = cyl(0.22, 0.26, 0.22, 8, panelMat, -0.86, 2.9, 0);
      const shoulderR = cyl(0.22, 0.26, 0.22, 8, panelMat,  0.86, 2.9, 0);
      shoulderL.rotation.z = Math.PI / 2;
      shoulderR.rotation.z = Math.PI / 2;
      robot.add(torso, chestPanel, shoulderL, shoulderR);

      // ── ARMS ─────────────────────────────────────────────────────────────────
      const armL = new THREE.Group();
      armL.position.set(-1.0, 2.75, 0);
      armL.add(box(0.38, 1.1, 0.38, bodyMat, 0, -0.55, 0)); // upper arm
      armL.add(cyl(0.15, 0.15, 0.18, 8, darkMat, 0, -1.15, 0)); // elbow
      armL.add(box(0.32, 0.85, 0.32, bodyMat, 0, -1.7, 0)); // lower arm
      armL.add(box(0.42, 0.22, 0.38, darkMat, 0, -2.2, 0.04)); // hand
      robot.add(armL);

      const armR = new THREE.Group();
      armR.position.set(1.0, 2.75, 0);
      armR.add(box(0.38, 1.1, 0.38, bodyMat, 0, -0.55, 0));
      armR.add(cyl(0.15, 0.15, 0.18, 8, darkMat, 0, -1.15, 0));
      armR.add(box(0.32, 0.85, 0.32, bodyMat, 0, -1.7, 0));
      armR.add(box(0.42, 0.22, 0.38, darkMat, 0, -2.2, 0.04));
      robot.add(armR);

      // ── NECK ─────────────────────────────────────────────────────────────────
      const neck = cyl(0.2, 0.25, 0.32, 8, darkMat, 0, 3.24, 0);
      robot.add(neck);

      // ── HEAD (wider at middle — matches reference upper silhouette) ───────────
      const head = new THREE.Group();
      head.position.set(0, 3.8, 0);
      robot.add(head);

      head.add(box(1.15, 0.95, 0.85, bodyMat));           // main head block
      head.add(box(1.05, 0.18, 0.9, darkMat, 0, -0.38, 0)); // jaw ledge
      head.add(box(0.82, 0.12, 0.88, panelMat, 0, 0.3, 0)); // forehead panel

      // ── EAR SENSORS ──────────────────────────────────────────────────────────
      head.add(box(0.12, 0.55, 0.3, panelMat, -0.64, 0.05, 0));
      head.add(box(0.12, 0.55, 0.3, panelMat,  0.64, 0.05, 0));

      // ── ANTENNA ──────────────────────────────────────────────────────────────
      const antenna = cyl(0.035, 0.05, 0.5, 6, panelMat, 0, 0.72, 0);
      const antennaTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        eyeMat.clone()
      );
      antennaTip.position.y = 0.3;
      antenna.add(antennaTip);
      head.add(antenna);

      // ── EYES (wide horizontal scanner slits, matching reference bright spots) ─
      // Reference: bright spots at x≈1035, y≈90-266 → upper face, two slits
      const eyeGeoW = new THREE.BoxGeometry(0.42, 0.09, 0.1);
      const eyeL = new THREE.Mesh(eyeGeoW, eyeMat);
      const eyeR = new THREE.Mesh(eyeGeoW, eyeMat);
      eyeL.position.set(-0.24, 0.05, 0.44);
      eyeR.position.set( 0.24, 0.05, 0.44);

      // Glow halo behind each eye (PointLight baked into mesh glow)
      const eyeGlowGeo = new THREE.BoxGeometry(0.52, 0.16, 0.06);
      const eyeGlowMat = new THREE.MeshBasicMaterial({
        color: laserHex,
        transparent: true,
        opacity: 0.22,
      });
      const glowL = new THREE.Mesh(eyeGlowGeo, eyeGlowMat);
      const glowR = new THREE.Mesh(eyeGlowGeo, eyeGlowMat);
      glowL.position.set(-0.24, 0.05, 0.42);
      glowR.position.set( 0.24, 0.05, 0.42);
      head.add(eyeL, eyeR, glowL, glowR);

      // ── LASER BEAMS from eyes ─────────────────────────────────────────────────
      // Wide flat plane extending forward from each eye
      const beamGeo = new THREE.PlaneGeometry(7, 0.09);
      const beamL = new THREE.Mesh(beamGeo, beamMat);
      const beamR = new THREE.Mesh(beamGeo, beamMat.clone());

      // Pivot from eye position, extend forward (positive Z in head-local space)
      // PlaneGeometry faces up by default → rotate to face forward, then offset
      beamL.rotation.y = Math.PI / 2;
      beamR.rotation.y = Math.PI / 2;
      beamL.position.set(-0.24 + 3.5, 0.05, 0.44); // center 3.5 units forward
      beamR.position.set( 0.24 + 3.5, 0.05, 0.44);
      beamL.rotation.y = 0; // keep plane vertical, extending along Z
      beamR.rotation.y = 0;

      // Actually: build beam groups so we can rotate them from eye pivot
      const beamGroupL = new THREE.Group();
      beamGroupL.position.set(-0.24, 0.05, 0.44);
      const bL = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.09), beamMat);
      bL.position.set(0, 0, 4);
      beamGroupL.add(bL);

      const beamGroupR = new THREE.Group();
      beamGroupR.position.set(0.24, 0.05, 0.44);
      const bR = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.09), beamMat.clone());
      bR.position.set(0, 0, 4);
      beamGroupR.add(bR);

      head.add(beamGroupL, beamGroupR);

      // Eye point lights (give environment colour cast)
      const eyeLightL = new THREE.PointLight(laserHex, 2.5, 6);
      eyeLightL.position.set(-0.24, 0.05, 1.2);
      const eyeLightR = new THREE.PointLight(laserHex, 2.5, 6);
      eyeLightR.position.set( 0.24, 0.05, 1.2);
      head.add(eyeLightL, eyeLightR);

      // ── GROUND GRID ──────────────────────────────────────────────────────────
      const grid = new THREE.GridHelper(60, 60, 0x1e293b, 0x0f172a);
      grid.position.y = 0;
      scene.add(grid);

      // ── FLOATING PARTICLES ───────────────────────────────────────────────────
      const pCount = 200;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 30;
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.06, transparent: true, opacity: 0.6 })
      );
      scene.add(particles);

      // Robot faces card (card is on left of viewport, robot on right)
      // Rotate robot so it faces left (negative X → card side)
      robot.rotation.y = -Math.PI * 0.18;
      robot.position.set(1.2, 0, 0);

      // ── RESIZE HANDLER ───────────────────────────────────────────────────────
      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      // ── ANIMATION ────────────────────────────────────────────────────────────
      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.016;

        // Robot bob
        robot.position.y = Math.sin(t * 0.7) * 0.07;

        // Arm swing
        armL.rotation.z =  0.22 + Math.sin(t * 0.9) * 0.12;
        armR.rotation.z = -0.22 - Math.sin(t * 0.9) * 0.12;

        // Head slight tilt
        head.rotation.y = Math.sin(t * 0.4) * 0.08;
        head.rotation.x = Math.sin(t * 0.3) * 0.04;

        // Laser beam sweep (vertical scan)
        const sweep = Math.sin(t * 1.8) * 0.28;
        beamGroupL.rotation.x = sweep;
        beamGroupR.rotation.x = sweep;

        // Antenna tip pulse
        antennaTip.material.emissiveIntensity = 2.5 + Math.sin(t * 3) * 1.5;

        // Eye intensity breathe
        const breathe = 3.5 + Math.sin(t * 2.2) * 0.8;
        eyeMat.emissiveIntensity = breathe;
        eyeGlowMat.opacity = 0.15 + Math.sin(t * 2.2) * 0.08;
        eyeLightL.intensity = 2 + Math.sin(t * 2.2) * 0.8;
        eyeLightR.intensity = 2 + Math.sin(t * 2.2) * 0.8;

        // Particle drift
        const pos = particles.geometry.attributes.position;
        for (let i = 0; i < pCount; i++) {
          pos.array[i * 3 + 1] += 0.012;
          if (pos.array[i * 3 + 1] > 12) pos.array[i * 3 + 1] = -6;
        }
        pos.needsUpdate = true;

        // Slow camera drift
        camera.position.x = -5 + Math.sin(t * 0.12) * 0.6;
        camera.position.y = 3.5 + Math.sin(t * 0.09) * 0.2;
        camera.lookAt(0, 2, 0);

        renderer.render(scene, camera);
      };
      animate();

      // ── CLEANUP ───────────────────────────────────────────────────────────────
      return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        renderer.dispose();
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    }

    const cleanup = init();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [mode, verdict]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
