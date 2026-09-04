import React, { useEffect, useRef } from 'react';

export default function RobotScene() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let THREE;
    try {
      THREE = require('three');
    } catch (e) {
      console.error('Three.js not available', e);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0B1120');
    scene.fog = new THREE.FogExp2('#0B1120', 0.06);

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 1.5, 0);

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0B1120, 0.6));

    const dirLight = new THREE.DirectionalLight(0x3B82F6, 0.9);
    dirLight.position.set(-8, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight1 = new THREE.PointLight(0x3B82F6, 1.2, 30);
    fillLight1.position.set(5, 3, 5);
    scene.add(fillLight1);

    const fillLight2 = new THREE.PointLight(0xF1F5F9, 0.5, 20);
    fillLight2.position.set(-5, 5, -3);
    scene.add(fillLight2);

    // Antenna tip light — will track eye color
    const antennaLight = new THREE.PointLight(0x3B82F6, 2.5, 8);
    antennaLight.position.set(0, 5.5, 0);
    scene.add(antennaLight);

    // ── Materials ─────────────────────────────────────────────
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#0F172A',
      metalness: 0.9,
      roughness: 0.1,
    });
    const wireOverlay = new THREE.MeshBasicMaterial({
      color: '#1E293B',
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });

    // ── Robot group ───────────────────────────────────────────
    const robot = new THREE.Group();
    scene.add(robot);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(1.4, 1.8, 0.9);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.castShadow = true;
    robot.add(torso);
    robot.add(new THREE.Mesh(torsoGeo, wireOverlay)); // panel lines

    // Shoulder pads
    [-0.85, 0.85].forEach(x => {
      const sg = new THREE.BoxGeometry(0.4, 0.3, 0.85);
      const sh = new THREE.Mesh(sg, bodyMat);
      sh.position.set(x, 0.75, 0);
      robot.add(sh);
    });

    // Head
    const headGeo = new THREE.BoxGeometry(1.1, 0.95, 0.85);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 1.45, 0);
    head.castShadow = true;
    robot.add(head);
    const headWire = new THREE.Mesh(headGeo, wireOverlay);
    headWire.position.copy(head.position);
    robot.add(headWire);

    // Eye slots — wide scanner slits
    const eyeSlitGeo = new THREE.BoxGeometry(0.38, 0.07, 0.08);
    const eyeMatL = new THREE.MeshStandardMaterial({ color: '#3B82F6', emissive: '#3B82F6', emissiveIntensity: 3.5 });
    const eyeMatR = new THREE.MeshStandardMaterial({ color: '#3B82F6', emissive: '#3B82F6', emissiveIntensity: 3.5 });

    const leftEye = new THREE.Mesh(eyeSlitGeo, eyeMatL);
    leftEye.position.set(-0.22, 1.52, 0.44);
    robot.add(leftEye);

    const rightEye = new THREE.Mesh(eyeSlitGeo, eyeMatR);
    rightEye.position.set(0.22, 1.52, 0.44);
    robot.add(rightEye);

    // Laser beams — wide flat planes from each eye
    const beamGeo = new THREE.PlaneGeometry(9, 0.07);
    const beamMatL = new THREE.MeshBasicMaterial({ color: '#3B82F6', transparent: true, opacity: 0.32, side: THREE.DoubleSide });
    const beamMatR = new THREE.MeshBasicMaterial({ color: '#3B82F6', transparent: true, opacity: 0.32, side: THREE.DoubleSide });

    const leftBeam = new THREE.Mesh(beamGeo, beamMatL);
    leftBeam.position.set(-0.22 + 4.5, 1.52, 0.44); // extends forward (Z world = into screen; offset in local space)
    leftBeam.rotation.y = Math.PI / 2; // face forward
    robot.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeo, beamMatR);
    rightBeam.position.set(0.22 + 4.5, 1.52, 0.44);
    rightBeam.rotation.y = Math.PI / 2;
    robot.add(rightBeam);

    // ── Reposition beams as children of head for easier rotation ──
    // Actually keep them as scene-level so we can sweep independently
    // Move beams out of robot group so they extend in world Z
    robot.remove(leftBeam);
    robot.remove(rightBeam);
    scene.add(leftBeam);
    scene.add(rightBeam);

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const ant = new THREE.Mesh(antGeo, bodyMat);
    ant.position.set(0, 2.25, 0);
    robot.add(ant);

    const antTipGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const antTipMat = new THREE.MeshStandardMaterial({ color: '#3B82F6', emissive: '#3B82F6', emissiveIntensity: 5 });
    const antTip = new THREE.Mesh(antTipGeo, antTipMat);
    antTip.position.set(0, 2.65, 0);
    robot.add(antTip);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.18, 0.13, 1.3, 8);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.95, -0.2, 0);
    leftArm.rotation.z = 0.4;
    robot.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.95, -0.2, 0);
    rightArm.rotation.z = -0.4;
    robot.add(rightArm);

    // Forearms
    const foreGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.9, 8);
    const leftFore = new THREE.Mesh(foreGeo, bodyMat);
    leftFore.position.set(-1.35, -0.78, 0);
    leftFore.rotation.z = 0.15;
    robot.add(leftFore);

    const rightFore = new THREE.Mesh(foreGeo, bodyMat);
    rightFore.position.set(1.35, -0.78, 0);
    rightFore.rotation.z = -0.15;
    robot.add(rightFore);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.42, 1.2, 0.42);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.38, -1.55, 0);
    robot.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.38, -1.55, 0);
    robot.add(rightLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.5, 0.22, 0.65);
    const leftFoot = new THREE.Mesh(footGeo, bodyMat);
    leftFoot.position.set(-0.38, -2.26, 0.1);
    robot.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, bodyMat);
    rightFoot.position.set(0.38, -2.26, 0.1);
    robot.add(rightFoot);

    robot.position.set(-1, 0.5, 0);

    // ── Ground grid ───────────────────────────────────────────
    const grid = new THREE.GridHelper(80, 80, '#1E293B', '#1E293B');
    grid.position.y = -2.8;
    scene.add(grid);

    // ── Orbiting scan target cubes ────────────────────────────
    const orbitCubes = [];
    const orbitWireMats = [];
    for (let i = 0; i < 8; i++) {
      const cg = new THREE.BoxGeometry(0.28, 0.28, 0.28);
      const wm = new THREE.MeshBasicMaterial({ color: '#3B82F6', wireframe: true });
      orbitWireMats.push(wm);
      const cube = new THREE.Mesh(cg, wm);
      const radius = 2.2 + Math.random() * 2.5;
      const speed = 0.3 + Math.random() * 0.4;
      const yOff = (Math.random() - 0.5) * 2;
      const phase = Math.random() * Math.PI * 2;
      orbitCubes.push({ mesh: cube, radius, speed, yOff, phase });
      scene.add(cube);
    }

    // ── Particle field ────────────────────────────────────────
    const PARTICLE_COUNT = 250;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ color: '#3B82F6', size: 0.07, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // ── Eye color state machine ────────────────────────────────
    const COLORS = [
      new THREE.Color('#3B82F6'), // blue idle
      new THREE.Color('#22C55E'), // green clean
      new THREE.Color('#F59E0B'), // amber suspicious
      new THREE.Color('#EF4444'), // red threat
    ];
    let colorStateIdx = 0;
    let nextColorIdx = 1;
    let colorT = 0;
    let stateTimer = 0;
    const STATE_DURATION = 3.0; // seconds per state
    const LERP_DURATION = 0.8;
    let currentColor = COLORS[0].clone();

    // ── Mouse interaction ──────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Click flash
    let flashTimer = 0;
    const onClick = () => { flashTimer = 0.2; };
    canvas.addEventListener('click', onClick);

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ────────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // ── Color state machine ──
      stateTimer += delta;
      colorT = Math.min(stateTimer / LERP_DURATION, 1);
      currentColor.copy(COLORS[colorStateIdx]).lerp(COLORS[nextColorIdx], colorT);

      if (stateTimer >= STATE_DURATION) {
        stateTimer = 0;
        colorStateIdx = nextColorIdx;
        nextColorIdx = (nextColorIdx + 1) % COLORS.length;
        colorT = 0;
      }

      // Flash override on click
      let eyeColor = currentColor;
      if (flashTimer > 0) {
        flashTimer -= delta;
        const flash = new THREE.Color('#FFFFFF');
        eyeColor = flash;
        [eyeMatL, eyeMatR].forEach(m => { m.emissive.copy(flash); m.emissiveIntensity = 8; });
        [beamMatL, beamMatR].forEach(m => { m.color.copy(flash); });
        antTipMat.emissive.copy(flash);
        antennaLight.color.copy(flash);
      } else {
        [eyeMatL, eyeMatR].forEach(m => { m.emissive.copy(currentColor); m.emissiveIntensity = 3.5; });
        [beamMatL, beamMatR].forEach(m => { m.color.copy(currentColor); });
        antTipMat.emissive.copy(currentColor);
        antTipMat.color.copy(currentColor);
        antennaLight.color.copy(currentColor);
      }

      // ── Robot body motion ──
      robot.position.y = 0.5 + Math.sin(t * 0.8) * 0.08;

      // Head tracks mouse + sways
      const targetHeadY = mouseX * 0.4 + Math.sin(t * 0.5) * 0.25;
      head.rotation.y += (targetHeadY - head.rotation.y) * 0.04;
      headWire.rotation.y = head.rotation.y;
      headWire.position.y = head.position.y;

      // Arms oscillate
      leftArm.rotation.z = 0.4 + Math.sin(t * 1.2) * 0.15;
      rightArm.rotation.z = -(0.4 + Math.sin(t * 1.2 + Math.PI) * 0.15);

      // ── Eye beam sweep ──
      // Beams are in world space — update their world position from robot+eye positions
      const robotPos = robot.position;
      const beamForwardOffset = 4.6;

      leftBeam.position.set(
        robotPos.x - 0.22,
        robotPos.y + 1.52,
        robotPos.z + 0.44 + beamForwardOffset
      );
      rightBeam.position.set(
        robotPos.x + 0.22,
        robotPos.y + 1.52,
        robotPos.z + 0.44 + beamForwardOffset
      );

      const beamSweep = Math.sin(t * 1.6) * 0.35;
      leftBeam.rotation.x = beamSweep;
      rightBeam.rotation.x = beamSweep + 0.05;

      // Antenna tip pulse
      antTip.scale.setScalar(1 + Math.sin(t * 3) * 0.15);

      // ── Camera slow orbit ──
      camera.position.x = Math.sin(t * 0.08) * 4;
      camera.position.z = 14 + Math.cos(t * 0.08) * 2;
      camera.position.y = 4 + Math.sin(t * 0.15) * 0.5;
      camera.lookAt(robot.position.x, robot.position.y + 1, 0);

      // ── Orbiting cubes ──
      orbitCubes.forEach(({ mesh, radius, speed, yOff, phase }, i) => {
        const ang = t * speed + phase;
        mesh.position.set(
          robotPos.x + Math.cos(ang) * radius,
          robotPos.y + yOff + Math.sin(t * 0.5 + i) * 0.3,
          robotPos.z + Math.sin(ang) * radius
        );
        mesh.rotation.x += delta * 1.5;
        mesh.rotation.y += delta * 1.0;
        orbitWireMats[i].color.copy(currentColor);
      });

      // ── Particles drift upward ──
      const pos = partGeo.attributes.position;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos.array[i * 3 + 1] += delta * 0.25;
        if (pos.array[i * 3 + 1] > 7) pos.array[i * 3 + 1] = -7;
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
