/**
 * car-builder.js
 * Builds procedural car meshes using Three.js geometry primitives.
 * Each "profile" defines body proportions for a car archetype.
 */

import * as THREE from 'three';

export const CAR_PROFILES = {
  sedan: {
    bodyLength: 4.8, bodyWidth: 1.9, bodyHeight: 0.55,
    roofLength: 2.2, roofHeight: 0.58, roofOffset: -0.2,
    wheelRadius: 0.33, wheelWidth: 0.22,
    frontOverhang: 0.9, rearOverhang: 0.8,
    wheelbase: 2.8,
  },
  coupe: {
    bodyLength: 4.6, bodyWidth: 1.9, bodyHeight: 0.50,
    roofLength: 1.9, roofHeight: 0.52, roofOffset: -0.1,
    wheelRadius: 0.33, wheelWidth: 0.24,
    frontOverhang: 0.85, rearOverhang: 0.75,
    wheelbase: 2.7,
  },
  suv: {
    bodyLength: 4.9, bodyWidth: 2.0, bodyHeight: 0.80,
    roofLength: 2.8, roofHeight: 0.65, roofOffset: -0.1,
    wheelRadius: 0.38, wheelWidth: 0.26,
    frontOverhang: 0.95, rearOverhang: 0.90,
    wheelbase: 2.85,
  },
  supercar: {
    bodyLength: 4.5, bodyWidth: 2.0, bodyHeight: 0.38,
    roofLength: 1.5, roofHeight: 0.40, roofOffset: 0.1,
    wheelRadius: 0.34, wheelWidth: 0.28,
    frontOverhang: 1.0, rearOverhang: 1.0,
    wheelbase: 2.6,
  },
  truck: {
    bodyLength: 5.8, bodyWidth: 2.1, bodyHeight: 0.85,
    roofLength: 1.8, roofHeight: 0.65, roofOffset: -1.1,
    wheelRadius: 0.42, wheelWidth: 0.30,
    frontOverhang: 1.0, rearOverhang: 2.2,
    wheelbase: 3.6,
  },
  hatchback: {
    bodyLength: 4.1, bodyWidth: 1.8, bodyHeight: 0.55,
    roofLength: 2.2, roofHeight: 0.60, roofOffset: -0.3,
    wheelRadius: 0.30, wheelWidth: 0.20,
    frontOverhang: 0.75, rearOverhang: 0.65,
    wheelbase: 2.6,
  },
};

/**
 * Build a complete car scene graph from a profile.
 * Returns a THREE.Group ready to be exported.
 */
export function buildCar(profileName = 'sedan', color = '#E63946') {
  const p = CAR_PROFILES[profileName] ?? CAR_PROFILES.sedan;
  const group = new THREE.Group();
  group.name = `car_${profileName}`;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.7,
    roughness: 0.25,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.5,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.1,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: new THREE.Color(0xffffaa),
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.1,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: new THREE.Color(0xff2200),
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.1,
  });

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(p.bodyLength, p.bodyHeight, p.bodyWidth, 4, 2, 4),
    bodyMat
  );
  body.name = 'body';
  body.position.y = p.wheelRadius + p.bodyHeight / 2;
  body.castShadow = true;
  group.add(body);

  // ── Cabin / Roof ──────────────────────────────────────────────────────────
  const cabinY = p.wheelRadius + p.bodyHeight + p.roofHeight / 2;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(p.roofLength, p.roofHeight, p.bodyWidth * 0.88, 3, 2, 3),
    bodyMat
  );
  cabin.name = 'cabin';
  cabin.position.set(p.roofOffset, cabinY, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Windshield (front)
  const windshield = new THREE.Mesh(
    new THREE.PlaneGeometry(p.roofLength * 0.52, p.roofHeight * 0.75),
    glassMat
  );
  windshield.name = 'windshield_front';
  windshield.position.set(
    p.roofOffset + p.roofLength * 0.46,
    cabinY - p.roofHeight * 0.06,
    0
  );
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.z = -Math.PI * 0.18;
  group.add(windshield);

  // Rear window
  const rearWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(p.roofLength * 0.45, p.roofHeight * 0.65),
    glassMat
  );
  rearWindow.name = 'windshield_rear';
  rearWindow.position.set(
    p.roofOffset - p.roofLength * 0.43,
    cabinY - p.roofHeight * 0.06,
    0
  );
  rearWindow.rotation.y = Math.PI / 2;
  rearWindow.rotation.z = Math.PI * 0.2;
  group.add(rearWindow);

  // ── Wheels ────────────────────────────────────────────────────────────────
  const halfWB = p.wheelbase / 2;
  const trackWidth = p.bodyWidth / 2 + p.wheelWidth / 2;
  const wheelY = p.wheelRadius;

  const wheelPositions = [
    [halfWB, wheelY, trackWidth, 'fl'],
    [halfWB, wheelY, -trackWidth, 'fr'],
    [-halfWB, wheelY, trackWidth, 'rl'],
    [-halfWB, wheelY, -trackWidth, 'rr'],
  ];

  for (const [x, y, z, name] of wheelPositions) {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = `wheel_${name}`;
    wheelGroup.position.set(x, y, z);

    // Tyre
    const tyre = new THREE.Mesh(
      new THREE.CylinderGeometry(p.wheelRadius, p.wheelRadius, p.wheelWidth, 24),
      tireMat
    );
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    wheelGroup.add(tyre);

    // Rim
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(p.wheelRadius * 0.65, p.wheelRadius * 0.65, p.wheelWidth * 1.01, 6),
      rimMat
    );
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    // Hub cap
    const hub = new THREE.Mesh(
      new THREE.CircleGeometry(p.wheelRadius * 0.18, 8),
      rimMat
    );
    hub.position.z = z > 0 ? p.wheelWidth / 2 + 0.01 : -(p.wheelWidth / 2 + 0.01);
    wheelGroup.add(hub);

    group.add(wheelGroup);
  }

  // ── Front bumper / headlights ──────────────────────────────────────────────
  const frontX = p.bodyLength / 2;
  const bumperY = p.wheelRadius + p.bodyHeight * 0.28;

  const bumper = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, p.bodyHeight * 0.55, p.bodyWidth * 0.85),
    bodyMat
  );
  bumper.position.set(frontX + 0.04, bumperY, 0);
  group.add(bumper);

  for (const side of [-1, 1]) {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.10, 0.28),
      lightMat
    );
    headlight.name = `headlight_${side > 0 ? 'l' : 'r'}`;
    headlight.position.set(frontX + 0.03, p.wheelRadius + p.bodyHeight * 0.52, side * p.bodyWidth * 0.32);
    group.add(headlight);
  }

  // ── Rear lights ────────────────────────────────────────────────────────────
  const rearX = -p.bodyLength / 2;
  for (const side of [-1, 1]) {
    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.09, 0.32),
      tailMat
    );
    taillight.name = `taillight_${side > 0 ? 'l' : 'r'}`;
    taillight.position.set(rearX - 0.03, p.wheelRadius + p.bodyHeight * 0.52, side * p.bodyWidth * 0.32);
    group.add(taillight);
  }

  // ── Underbody / floor ───────────────────────────────────────────────────────
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(p.bodyLength * 0.9, 0.06, p.bodyWidth * 0.75),
    new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.8 })
  );
  floor.name = 'underbody';
  floor.position.y = p.wheelRadius + 0.03;
  group.add(floor);

  // Centre car at origin (y=0 at ground plane)
  group.position.y = 0;

  return group;
}
