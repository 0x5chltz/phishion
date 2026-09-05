'use client';
import { useEffect, useRef } from 'react';

// Color map: verdict -> laser hex
const VERDICT_COLORS = {
  malicious: 0xef4444,
  suspicious: 0xf59e0b,
  clean: 0x22c55e,
  loading: 0x3b82f6,
  default: 0xffffff,
};

function laserHexFor(mode, verdict) {
  if (mode === 'inspect') return VERDICT_COLORS.default;
  return VERDICT_COLORS[verdict] ?? VERDICT_COLORS.loading;
}

// Where the beam aims when the card cannot be measured, in normalized device
// coordinates. x is left of centre because the card sits in the left half.
const FALLBACK_TARGET = { x: -0.45, top: 0.34, bottom: -0.34 };

export default function RobotScene({ mode = 'inspect', verdict = null }) {
  const mountRef = useRef(null);
  // Holds everything the colour effect needs to reach without rebuilding the
  // scene, so changing verdict does not tear down and re-create the canvas.
  const sceneRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanupFn = null;

    async function init() {
      const THREE = await import('three');
      if (disposed || !mountRef.current) return;

      const mount = mountRef.current;
      const W = mount.clientWidth || 1;
      const H = mount.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b1120);
      scene.fog = new THREE.FogExp2(0x0b1120, 0.06);

      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
      camera.position.set(-5, 3.5, 9);
      camera.lookAt(0, 2, 0);

      scene.add(new THREE.AmbientLight(0x0b1120, 0.7));
      const keyLight = new THREE.DirectionalLight(0x3b82f6, 1.2);
      keyLight.position.set(-4, 8, 4);
      keyLight.castShadow = true;
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x1e293b, 0.9, 30);
      fillLight.position.set(4, 3, -3);
      scene.add(fillLight);

      // ── Materials ──────────────────────────────────────────────────────────
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.15 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });

      const hex = laserHexFor(mode, verdict);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: hex,
        emissive: new THREE.Color(hex),
        emissiveIntensity: 4,
      });
      const tipMat = eyeMat.clone();
      // Wide, soft cone of light. Additive so overlapping beams read as glow.
      const haloMat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      // The bright filament down the middle of the cone.
      const coreMat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const disposables = [bodyMat, darkMat, panelMat, eyeMat, tipMat, haloMat, coreMat];

      // ── Build helpers ──────────────────────────────────────────────────────
      const track = (geo) => {
        disposables.push(geo);
        return geo;
      };
      const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
        const m = new THREE.Mesh(track(geo), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        return m;
      };
      const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
      const capsule = (r, len, mat, x, y, z) =>
        mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat, x, y, z);
      const ball = (r, mat, x, y, z) => mesh(new THREE.SphereGeometry(r, 18, 14), mat, x, y, z);

      // ── Humanoid ───────────────────────────────────────────────────────────
      const robot = new THREE.Group();
      scene.add(robot);

      // Leg: hip -> thigh -> knee -> shin -> ankle -> foot. Grouped at the hip
      // so the whole limb can swing from one pivot.
      const buildLeg = (side) => {
        const g = new THREE.Group();
        g.position.set(0.34 * side, 2.02, 0);
        g.add(ball(0.19, panelMat, 0, 0, 0));
        g.add(capsule(0.16, 0.62, bodyMat, 0, -0.47, 0));
        g.add(ball(0.15, darkMat, 0, -0.92, 0));
        g.add(capsule(0.13, 0.6, bodyMat, 0, -1.36, 0));
        g.add(ball(0.12, darkMat, 0, -1.8, 0));
        g.add(box(0.3, 0.14, 0.56, darkMat, 0, -1.9, 0.12));
        return g;
      };
      const legL = buildLeg(-1);
      const legR = buildLeg(1);
      robot.add(legL, legR);

      // Torso
      robot.add(box(0.72, 0.34, 0.44, panelMat, 0, 2.16, 0)); // pelvis
      robot.add(capsule(0.22, 0.24, darkMat, 0, 2.52, 0)); // waist / spine
      const chest = box(1.0, 0.98, 0.56, bodyMat, 0, 3.08, 0);
      robot.add(chest);
      robot.add(box(0.56, 0.44, 0.1, panelMat, 0, 3.16, 0.31)); // chest plate
      for (let i = 0; i < 3; i++) {
        robot.add(box(0.44, 0.04, 0.12, darkMat, 0, 2.98 - i * 0.13, 0.32));
      }
      robot.add(box(0.86, 0.16, 0.42, panelMat, 0, 3.5, 0)); // clavicle bar

      // Arm: shoulder -> upper arm -> elbow -> forearm -> hand.
      const buildArm = (side) => {
        const g = new THREE.Group();
        g.position.set(0.6 * side, 3.4, 0);
        g.add(ball(0.2, panelMat, 0, 0, 0));
        g.add(capsule(0.13, 0.5, bodyMat, 0, -0.42, 0));
        g.add(ball(0.12, darkMat, 0, -0.8, 0));
        g.add(capsule(0.11, 0.46, bodyMat, 0, -1.14, 0));
        g.add(ball(0.11, darkMat, 0, -1.48, 0)); // hand
        g.add(box(0.05, 0.2, 0.14, darkMat, 0.04 * side, -1.62, 0.03)); // fingers
        return g;
      };
      const armL = buildArm(-1);
      const armR = buildArm(1);
      robot.add(armL, armR);

      // Neck and head
      robot.add(capsule(0.11, 0.14, darkMat, 0, 3.68, 0));
      const head = new THREE.Group();
      head.position.set(0, 4.02, 0);
      robot.add(head);

      head.add(mesh(new THREE.SphereGeometry(0.42, 22, 18), bodyMat, 0, 0, 0));
      head.add(box(0.62, 0.3, 0.12, darkMat, 0, 0.02, 0.34)); // visor recess
      head.add(box(0.66, 0.1, 0.1, panelMat, 0, 0.24, 0.33)); // brow
      head.add(box(0.36, 0.12, 0.1, panelMat, 0, -0.28, 0.3)); // chin vent
      head.add(box(0.08, 0.26, 0.2, panelMat, -0.4, 0.02, 0)); // ear
      head.add(box(0.08, 0.26, 0.2, panelMat, 0.4, 0.02, 0));

      const antenna = mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 6), panelMat, 0, 0.6, 0);
      const antennaTip = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 10, 10)), tipMat);
      antennaTip.position.y = 0.25;
      antenna.add(antennaTip);
      head.add(antenna);

      // Eyes sit on the visor. Beam origins are read from these each frame.
      const eyeGeo = track(new THREE.SphereGeometry(0.075, 14, 12));
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.15, 0.03, 0.39);
      eyeR.position.set(0.15, 0.03, 0.39);
      head.add(eyeL, eyeR);

      const eyeLight = new THREE.PointLight(hex, 2.2, 7);
      eyeLight.position.set(0, 0.03, 0.7);
      head.add(eyeLight);

      // ── Eye lasers ─────────────────────────────────────────────────────────
      // Cones live on the scene, not the head. Parented to the head they would
      // inherit its sway and drift off the card; here the aim is set explicitly
      // every frame so it stays locked on the card no matter how the head moves.
      //
      // Geometry is authored apex-at-origin pointing down +Z, because
      // Object3D.lookAt aims +Z at the target. Length and spread then come from
      // scale, so one geometry serves any distance.
      const makeCone = (radius, mat) => {
        const g = new THREE.ConeGeometry(radius, 1, 26, 1, true);
        g.translate(0, -0.5, 0); // apex to origin
        g.rotateX(-Math.PI / 2); // body along +Z
        return new THREE.Mesh(track(g), mat);
      };

      const beams = [eyeL, eyeR].map((eye) => {
        const pivot = new THREE.Group();
        const halo = makeCone(1, haloMat); // the wide light spread
        const core = makeCone(0.12, coreMat); // the bright filament
        pivot.add(halo, core);
        scene.add(pivot);
        return { eye, pivot, halo, core };
      });

      // Small glow where the beam lands, so the sweep reads as hitting something.
      const hitMat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      disposables.push(hitMat);
      const hit = new THREE.Mesh(track(new THREE.CircleGeometry(0.42, 24)), hitMat);
      scene.add(hit);

      const grid = new THREE.GridHelper(60, 60, 0x1e293b, 0x0f172a);
      scene.add(grid);
      disposables.push(grid.geometry, grid.material);

      const pCount = 200;
      const pGeo = track(new THREE.BufferGeometry());
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 30;
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.06, transparent: true, opacity: 0.6 });
      disposables.push(pMat);
      scene.add(new THREE.Points(pGeo, pMat));

      robot.rotation.y = -Math.PI * 0.18;
      robot.position.set(1.2, 0, 0);

      // ── Where is the card? ─────────────────────────────────────────────────
      // Measured from the DOM so the sweep tracks the real card, which is a
      // different height on /inspect than on /result once results render.
      let target = { ...FALLBACK_TARGET };

      const measureCard = () => {
        const host = mount.parentElement;
        if (!host) return;
        const candidates = host.querySelectorAll('form, [class*="card"], [class*="Card"]');
        let best = null;
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          if (r.width < 80 || r.height < 60) continue;
          if (!best || r.height > best.height) best = r;
        }
        const hostRect = host.getBoundingClientRect();
        if (!best || !hostRect.width || !hostRect.height) {
          target = { ...FALLBACK_TARGET };
          return;
        }
        const toNdcX = (px) => ((px - hostRect.left) / hostRect.width) * 2 - 1;
        const toNdcY = (py) => -(((py - hostRect.top) / hostRect.height) * 2 - 1);
        // Inset slightly so the beam sweeps the card face, not past its edges.
        const inset = best.height * 0.12;
        target = {
          x: toNdcX(best.left + best.width * 0.62),
          top: toNdcY(best.top + inset),
          bottom: toNdcY(best.bottom - inset),
        };
      };

      measureCard();

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth || 1;
        const h = mountRef.current.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        measureCard();
      };
      window.addEventListener('resize', onResize);

      const eyeWorld = new THREE.Vector3();
      const aim = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      sceneRef.current = {
        THREE,
        materials: [eyeMat, tipMat, haloMat, coreMat, hitMat],
        lights: [eyeLight],
      };

      let t = 0;
      let frame = 0;
      let animId = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.016;
        frame++;

        // The card can change height as results load, so re-measure now and
        // then rather than only on resize.
        if (frame % 45 === 0) measureCard();

        robot.position.y = Math.sin(t * 0.7) * 0.07;

        // Walk-idle: legs counter-swing against the arms.
        const gait = Math.sin(t * 0.9);
        armL.rotation.x = 0.1 + gait * 0.16;
        armR.rotation.x = 0.1 - gait * 0.16;
        armL.rotation.z = 0.1;
        armR.rotation.z = -0.1;
        legL.rotation.x = -gait * 0.08;
        legR.rotation.x = gait * 0.08;

        // Head holds its gaze on the card, so the sway is small.
        head.rotation.y = Math.sin(t * 0.4) * 0.05;
        head.rotation.x = Math.sin(t * 0.3) * 0.03;

        // Vertical scan across the card: 0 at the top, 1 at the bottom.
        const scan = (Math.sin(t * 1.15) + 1) / 2;
        const ndcY = target.top + (target.bottom - target.top) * scan;
        aim.set(target.x, ndcY, 0.5).unproject(camera);

        for (const b of beams) {
          b.eye.getWorldPosition(eyeWorld);
          b.pivot.position.copy(eyeWorld);
          b.pivot.up.copy(up);
          b.pivot.lookAt(aim);
          const dist = eyeWorld.distanceTo(aim);
          // Spread widens with distance so the far end covers the card face.
          const spread = 0.06 + dist * 0.028;
          b.halo.scale.set(spread, spread, dist);
          b.core.scale.set(spread * 0.5, spread * 0.5, dist);
        }

        hit.position.copy(aim);
        hit.lookAt(camera.position);
        const pulse = 0.28 + Math.sin(t * 2.2) * 0.1;
        hitMat.opacity = pulse;

        tipMat.emissiveIntensity = 2.5 + Math.sin(t * 3) * 1.5;
        eyeMat.emissiveIntensity = 3.5 + Math.sin(t * 2.2) * 0.8;
        eyeLight.intensity = 2 + Math.sin(t * 2.2) * 0.8;
        haloMat.opacity = 0.08 + Math.sin(t * 2.2) * 0.03;
        coreMat.opacity = 0.5 + Math.sin(t * 2.2) * 0.12;

        const pos = pGeo.attributes.position;
        for (let i = 0; i < pCount; i++) {
          pos.array[i * 3 + 1] += 0.012;
          if (pos.array[i * 3 + 1] > 12) pos.array[i * 3 + 1] = -6;
        }
        pos.needsUpdate = true;

        camera.position.x = -5 + Math.sin(t * 0.12) * 0.6;
        camera.position.y = 3.5 + Math.sin(t * 0.09) * 0.2;
        camera.lookAt(0, 2, 0);

        renderer.render(scene, camera);
      };
      animate();

      cleanupFn = () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        sceneRef.current = null;
        for (const d of disposables) {
          if (d && typeof d.dispose === 'function') d.dispose();
        }
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    }

    init();

    return () => {
      disposed = true;
      if (cleanupFn) cleanupFn();
    };
    // Built once. Colour changes are handled below so a new verdict does not
    // tear down the canvas mid-scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const hex = laserHexFor(mode, verdict);
    const color = new s.THREE.Color(hex);
    for (const m of s.materials) {
      if (m.color) m.color.set(color);
      if (m.emissive) m.emissive.set(color);
    }
    for (const l of s.lights) l.color.set(color);
  }, [mode, verdict]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
