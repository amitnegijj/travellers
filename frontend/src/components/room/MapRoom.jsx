// A small 3D diorama — a room you can drag-orbit around, with the actual
// live destinations map mounted on the back wall like a framed painting.
//
// This is deliberately NOT a full first-person walkthrough (no WASD, no
// pointer lock, no collision) — it's an orbit-camera diorama: cheaper to
// build and robust on trackpads/mobile. What sells the "real place" feel
// instead of geometric complexity: rounded furniture edges, image-based
// lighting + soft contact shadows instead of flat color, and a GSAP camera
// dolly-in on load instead of dropping the viewer straight into the static
// shot. The one part that's fully real: the "painting" is the actual
// MapCanvas component, live and interactive, not a screenshot of one.
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows, Environment, Html, OrbitControls, RoundedBox, Text,
} from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Suspense, lazy, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import { Skeleton } from "../ui.jsx";

const MapCanvas = lazy(() => import("../map/map-canvas.jsx").then((m) => ({ default: m.MapCanvas })));

const ROOM = { width: 9, depth: 6, height: 4.2 };
const WOOD = "#7d4f31";
const WALL = "#f1ece1";
const WALL_DARK = "#e4dccb";
const FLOOR = "#b98f63";

// Small, cheap bevel shared by every piece of furniture — this alone is most
// of what separates "3D diorama" from "pile of CSS boxes".
const ROUND = { smoothness: 2, bevelSegments: 2 };

// The pose OrbitControls takes over at once the intro dolly finishes — kept
// identical to the values the controls below were empirically clamped
// against (see the comment on OrbitControls), so the handoff is invisible.
const TARGET = [0, 1.6, -1];
const REST_POSITION = [0, 2.4, 5.5];
const INTRO_START = [0, 4.6, 11];

function Room({ deskRef, plantRef, rugRef }) {
  const { width, depth, height } = ROOM;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshPhysicalMaterial color={FLOOR} roughness={0.6} clearcoat={0.25} clearcoatRoughness={0.5} />
      </mesh>

      {/* back wall */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>

      {/* left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[depth, height, 0.1]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.95} />
      </mesh>

      {/* right wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[depth, height, 0.1]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.95} />
      </mesh>

      {/* skirting board, back wall */}
      <RoundedBox args={[width, 0.24, 0.06]} radius={0.015} {...ROUND} position={[0, 0.12, -depth / 2 + 0.06]}>
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </RoundedBox>

      {/* window, right wall */}
      <group position={[width / 2 - 0.06, height / 2 + 0.3, 1.6]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.8, 1.6]} />
          <meshPhysicalMaterial
            color="#eaf4fb"
            transmission={0.92}
            roughness={0.06}
            thickness={0.05}
            ior={1.45}
            emissive="#bcd7e6"
            emissiveIntensity={0.08}
          />
        </mesh>
        <RoundedBox args={[0.06, 1.6, 0.04]} radius={0.012} {...ROUND} position={[0, 0, 0.01]}>
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.8, 0.06, 0.04]} radius={0.012} {...ROUND} position={[0, 0, 0.01]}>
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </RoundedBox>
      </group>

      <Desk position={[-2.6, 0, 1.6]} groupRef={deskRef} />
      <Plant position={[3.4, 0, -1.8]} groupRef={plantRef} />
      <Rug groupRef={rugRef} />
    </group>
  );
}

function Desk({ position, groupRef }) {
  const legXs = [-0.55, 0.55];
  const legZs = [-0.32, 0.32];
  return (
    <group position={position} ref={groupRef} scale={0}>
      <RoundedBox args={[1.3, 0.05, 0.7]} radius={0.02} {...ROUND} position={[0, 0.72, 0]} castShadow>
        <meshPhysicalMaterial color={WOOD} roughness={0.45} clearcoat={0.3} clearcoatRoughness={0.4} />
      </RoundedBox>
      {legXs.flatMap((x) =>
        legZs.map((z) => (
          <RoundedBox
            key={`${x}-${z}`}
            args={[0.06, 0.72, 0.06]}
            radius={0.012}
            {...ROUND}
            position={[x, 0.36, z]}
            castShadow
          >
            <meshStandardMaterial color="#3f2d22" roughness={0.5} />
          </RoundedBox>
        ))
      )}
      {/* chair */}
      <group position={[0, 0, 0.75]}>
        <RoundedBox args={[0.45, 0.06, 0.45]} radius={0.02} {...ROUND} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#2563eb" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[0.45, 0.5, 0.06]} radius={0.02} {...ROUND} position={[0, 0.7, 0.2]} castShadow>
          <meshStandardMaterial color="#2563eb" roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function Plant({ position, groupRef }) {
  return (
    <group position={position} ref={groupRef} scale={0}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.44, 12]} />
        <meshStandardMaterial color="#a8542f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow>
        <sphereGeometry args={[0.34, 12, 12]} />
        <meshStandardMaterial color="#2f7a4f" roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.9, 0.05]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#3a8f5c" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Rug({ groupRef }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.01, 1.3]} ref={groupRef} scale={0}>
      <planeGeometry args={[2.6, 1.8]} />
      <meshStandardMaterial color="#c65a3b" roughness={0.9} />
    </mesh>
  );
}

/** The framed, working map — the whole point of this scene. */
function MapPainting({ markers, groupRef }) {
  const depth = ROOM.depth;
  const frameW = 3.7;
  const frameH = 2.25;
  const y = 2.15;
  const z = -depth / 2 + 0.09;

  return (
    <group ref={groupRef} scale={0}>
      {/* frame */}
      <RoundedBox args={[frameW, frameH, 0.06]} radius={0.02} {...ROUND} position={[0, y, z - 0.03]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>

      {/*
        `transform` mode already derives real 3D perspective from the R3F
        camera — the div's CSS pixel size IS its world-space footprint at
        this position, no separate scale multiplier needed (adding one here
        previously compounded with drei's own math and shrank this to a few
        screen pixels). Sized a little smaller than the frame mesh above so
        the wood border shows around it.
      */}
      <Html
        transform
        occlude
        position={[0, y, z]}
        style={{ pointerEvents: "auto" }}
      >
        <div
          style={{
            width: 156,
            height: 95,
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 0 0 3px #f4efe6",
            background: "#e9edf1",
          }}
        >
          {/* Same default as the real /map page — frames itself to wherever
              the destination pins actually are, rather than a fixed center. */}
          <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#e9edf1" }} />}>
            <MapCanvas
              markers={markers}
              height={95}
              controls={false}
              className="!rounded-none !border-0"
            />
          </Suspense>
        </div>
      </Html>

      <Text
        position={[0, y - frameH / 2 - 0.22, z + 0.02]}
        fontSize={0.16}
        color="#5b6779"
        anchorX="center"
        anchorY="middle"
      >
        Where our travellers have been
      </Text>
    </group>
  );
}

function Lighting() {
  return (
    <>
      {/* Image-based lighting: gives every material a believable ambient
          fill + soft specular response instead of the flat, shadeless look
          plain ambientLight produces. background=false is load-bearing —
          true would replace the walls with a visible HDRI panorama. */}
      <Environment preset="apartment" background={false} environmentIntensity={0.85} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-2, 3, 2]} intensity={0.25} color="#fff4e0" />
    </>
  );
}

/**
 * Camera-only: dollies in from a wide establishing shot to the resting orbit
 * pose, then hands off to OrbitControls. Runs before OrbitControls mounts —
 * three.js's OrbitControls re-derives camera.position from its own internal
 * spherical state every frame once active, which would fight any outside
 * animation of camera.position while attached.
 */
function CameraIntro({ onDone }) {
  const { camera } = useThree();
  const done = useRef(false);

  useGSAP(() => {
    camera.lookAt(...TARGET);

    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDone();
    };

    const tween = gsap.to(camera.position, {
      x: REST_POSITION[0],
      y: REST_POSITION[1],
      z: REST_POSITION[2],
      duration: 2,
      delay: 0.2,
      ease: "power3.out",
      onUpdate: () => camera.lookAt(...TARGET),
      onComplete: finish,
    });

    // Belt and suspenders: gsap's ticker rides on requestAnimationFrame,
    // which browsers throttle hard (observed: ~1fps) for a backgrounded/
    // unfocused tab. setTimeout is throttled far less aggressively, so this
    // guarantees the viewer is never stuck looking at a non-interactive
    // establishing shot if the tween stalls for any reason.
    const safety = setTimeout(() => {
      tween.kill();
      camera.position.set(...REST_POSITION);
      camera.lookAt(...TARGET);
      finish();
    }, 4000);

    return () => clearTimeout(safety);
  });

  return null;
}

function Scene({ markers }) {
  const deskRef = useRef(null);
  const plantRef = useRef(null);
  const rugRef = useRef(null);
  const paintingRef = useRef(null);
  const [introDone, setIntroDone] = useState(false);

  // Furniture and the painting rise into place after the camera settles,
  // rather than just being "there" on frame one — same idea as the intro
  // dolly, applied to the objects instead of the camera. Each one starts
  // hidden via a declarative scale={0} in JSX rather than an imperative
  // gsap.set() here — React StrictMode's dev-only double-invoke reverts
  // this effect right after its first run, and a detached .set() survives
  // that revert while the timeline animating away from it doesn't, which
  // previously left everything permanently scaled to zero. Starting from
  // React-owned state means the (possibly restarted) timeline always has
  // something valid to animate away from.
  useGSAP(() => {
    if (!rugRef.current || !deskRef.current || !plantRef.current || !paintingRef.current) return;

    const targets = [rugRef.current, deskRef.current, plantRef.current, paintingRef.current];

    const tl = gsap.timeline({ delay: 0.9 });
    tl.to(rugRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "power2.out" })
      .to(deskRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(1.6)" }, "-=0.5")
      .to(plantRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(1.6)" }, "-=0.55")
      .to(paintingRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "power2.out" }, "-=0.3");

    // Same reasoning as CameraIntro's safety net: guarantees the room is
    // never left with permanently invisible furniture if the tab was
    // backgrounded (throttling gsap's rAF-driven ticker) while this ran.
    const safety = setTimeout(() => {
      tl.kill();
      targets.forEach((o) => o.scale.set(1, 1, 1));
    }, 4500);

    return () => clearTimeout(safety);
  });

  return (
    <>
      <CameraIntro onDone={() => setIntroDone(true)} />
      <Lighting />
      <Room deskRef={deskRef} plantRef={plantRef} rugRef={rugRef} />
      <MapPainting markers={markers} groupRef={paintingRef} />
      <ContactShadows
        position={[0, 0.015, 0]}
        scale={[8, 5.5]}
        opacity={0.55}
        blur={2.4}
        far={3}
        resolution={512}
        color="#1a1108"
      />
      {introDone ? (
        <OrbitControls
          makeDefault
          target={TARGET}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          // Wide enough to swing and feel like "looking around", tight enough
          // that the camera can never reach the side walls at any combination
          // of these extremes — verified empirically by dragging all the way
          // to each clamp, not just derived on paper (the first pass here,
          // +/-57.6 degrees azimuth with minDistance 3.2, let the camera clip
          // straight through a side wall at a grazing angle).
          minDistance={5}
          maxDistance={7.5}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.44}
          minAzimuthAngle={-Math.PI * 0.16}
          maxAzimuthAngle={Math.PI * 0.16}
        />
      ) : null}
    </>
  );
}

function RoomFallback() {
  return <Skeleton className="h-[420px] w-full rounded-[var(--radius-xl)]" />;
}

/**
 * The room fetches the same data the real /map page shows — this is a
 * second live view of it, not a copy of the data.
 */
export function MapRoom() {
  const { data, loading } = useApi((signal) => api.get("/api/v1/map", signal), []);

  if (loading) return <RoomFallback />;

  const markers = (data?.destinations ?? []).map((d) => ({
    id: d.id,
    lng: Number(d.lng),
    lat: Number(d.lat),
    label: d.name,
    sublabel: d.journeyCount ? `${d.journeyCount} journeys` : undefined,
    href: `/destinations/${d.slug}`,
    tone: "brand",
  }));

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-b from-[var(--bg-subtle)] to-[var(--surface-2)]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: INTRO_START, fov: 45 }}>
        <Suspense fallback={null}>
          <Scene markers={markers} />
        </Suspense>
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
        Drag to look around · scroll to zoom
      </p>
    </div>
  );
}
