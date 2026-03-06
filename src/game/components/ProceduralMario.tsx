import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProceduralMarioProps {
    walkingRef: React.MutableRefObject<boolean>;
}

/** Plain-color material helper */
function M(color: string, roughness = 0.75, metalness = 0) {
    return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
}

/** Canvas texture for the M badge on the hat */
function makeCapBadgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    // White circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    // Red border
    ctx.strokeStyle = '#cc1a1a';
    ctx.lineWidth = 8;
    ctx.stroke();
    // M letter
    ctx.fillStyle = '#cc1a1a';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 64, 67);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export default function ProceduralMario({ walkingRef }: ProceduralMarioProps) {
    const badgeTex = useMemo(makeCapBadgeTexture, []);

    const rootRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const lArmRef = useRef<THREE.Group>(null);
    const rArmRef = useRef<THREE.Group>(null);
    const lLegRef = useRef<THREE.Group>(null);
    const rLegRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const walking = walkingRef.current; // Read EVERY FRAME

        if (walking) {
            // ── RUN ANIMATION ──
            const spd = 11;
            const phase = t * spd;
            const legSwing = 0.75;   // bigger stride
            const armSwing = 0.80;

            // Legs: opposite swing with slight bend at the back
            if (lLegRef.current) {
                lLegRef.current.rotation.x = Math.sin(phase) * legSwing;
                lLegRef.current.rotation.z = 0; // keep straight
            }
            if (rLegRef.current) {
                rLegRef.current.rotation.x = -Math.sin(phase) * legSwing;
                rLegRef.current.rotation.z = 0;
            }

            // Arms: pumping opposite to legs, elbows bent
            if (lArmRef.current) {
                lArmRef.current.rotation.x = -Math.sin(phase) * armSwing;
                lArmRef.current.rotation.z = 0.15; // tucked in
            }
            if (rArmRef.current) {
                rArmRef.current.rotation.x = Math.sin(phase) * armSwing;
                rArmRef.current.rotation.z = -0.15;
            }

            // Torso: lean forward + slight twist
            if (bodyRef.current) {
                bodyRef.current.rotation.x = 0.18;
                bodyRef.current.rotation.y = Math.sin(phase) * 0.08;
                bodyRef.current.rotation.z = Math.sin(phase * 0.5) * 0.04;
            }

            // Head: compensate lean, slight bob
            if (headRef.current) {
                headRef.current.rotation.x = -0.15 + Math.sin(phase * 2) * 0.025;
                headRef.current.rotation.y = Math.sin(phase) * 0.04;
            }

            // Root: bounce - double-step feel
            if (rootRef.current) {
                rootRef.current.position.y = Math.abs(Math.sin(phase)) * 0.06;
            }
        } else {
            // ── IDLE ANIMATION ──
            const s = 2.0;
            const breath = Math.sin(t * s) * 0.015;
            const sway = Math.sin(t * 1.2) * 0.01;

            // Legs: return to standing
            if (lLegRef.current) {
                lLegRef.current.rotation.x = THREE.MathUtils.lerp(lLegRef.current.rotation.x, 0, 0.12);
                lLegRef.current.rotation.z = THREE.MathUtils.lerp(lLegRef.current.rotation.z, 0, 0.1);
            }
            if (rLegRef.current) {
                rLegRef.current.rotation.x = THREE.MathUtils.lerp(rLegRef.current.rotation.x, 0, 0.12);
                rLegRef.current.rotation.z = THREE.MathUtils.lerp(rLegRef.current.rotation.z, 0, 0.1);
            }

            // Arms: relaxed at sides with gentle sway
            if (lArmRef.current) {
                lArmRef.current.rotation.x = THREE.MathUtils.lerp(lArmRef.current.rotation.x, 0.05, 0.08);
                lArmRef.current.rotation.z = THREE.MathUtils.lerp(lArmRef.current.rotation.z, 0.18, 0.06);
            }
            if (rArmRef.current) {
                rArmRef.current.rotation.x = THREE.MathUtils.lerp(rArmRef.current.rotation.x, 0.05, 0.08);
                rArmRef.current.rotation.z = THREE.MathUtils.lerp(rArmRef.current.rotation.z, -0.18, 0.06);
            }

            // Torso: upright with subtle breathing
            if (bodyRef.current) {
                bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.08);
                bodyRef.current.rotation.y = sway;
                bodyRef.current.rotation.z = 0;
            }

            // Head: gentle look around
            if (headRef.current) {
                headRef.current.rotation.x = Math.sin(t * 1.3) * 0.04;
                headRef.current.rotation.y = Math.sin(t * 0.8) * 0.06;
            }

            // Root: breathing motion
            if (rootRef.current) {
                rootRef.current.position.y = breath * 0.5;
            }
        }
    });

    const sm = { castShadow: true, receiveShadow: true } as const;

    /*
     * COORDINATE SYSTEM:
     *   +Z = FRONT (facing the camera in a side-scroller view)
     *   -Z = BACK
     *   +X = Mario's LEFT,  -X = Mario's RIGHT
     *   +Y = UP
     *
     *   Mario3D.tsx flips scale.x to change direction.
     */

    return (
        <group>
            <group ref={rootRef}>

                {/* ═══════ LEGS ═══════ */}
                {/* Left leg */}
                <group position={[-0.135, 0.17, 0]} ref={lLegRef}>
                    <mesh {...sm} position={[0, -0.1, 0]}>
                        <cylinderGeometry args={[0.09, 0.085, 0.21, 16]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0, -0.22, 0]}>
                        <sphereGeometry args={[0.09, 12, 12]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0, -0.31, 0]}>
                        <cylinderGeometry args={[0.09, 0.082, 0.14, 16]} />
                        {M('#1a40c8', 0.9)}
                    </mesh>
                    <group position={[0, -0.41, 0.04]}>
                        <mesh {...sm} rotation={[0.3, 0, 0]}>
                            <capsuleGeometry args={[0.1, 0.18, 10, 16]} />
                            {M('#6b3318', 0.65)}
                        </mesh>
                    </group>
                </group>

                {/* Right leg */}
                <group position={[0.135, 0.17, 0]} ref={rLegRef}>
                    <mesh {...sm} position={[0, -0.1, 0]}>
                        <cylinderGeometry args={[0.09, 0.085, 0.21, 16]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0, -0.22, 0]}>
                        <sphereGeometry args={[0.09, 12, 12]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0, -0.31, 0]}>
                        <cylinderGeometry args={[0.09, 0.082, 0.14, 16]} />
                        {M('#1a40c8', 0.9)}
                    </mesh>
                    <group position={[0, -0.41, 0.04]}>
                        <mesh {...sm} rotation={[0.3, 0, 0]}>
                            <capsuleGeometry args={[0.1, 0.18, 10, 16]} />
                            {M('#6b3318', 0.65)}
                        </mesh>
                    </group>
                </group>

                {/* ═══════ BODY + ARMS + HEAD ═══════ */}
                <group ref={bodyRef} position={[0, 0.3, 0]}>

                    {/* Red shirt (slimmer belly) */}
                    <mesh {...sm} position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.22, 16, 16]} />
                        {M('#db2020', 0.8)}
                    </mesh>

                    {/* Blue overall bib (front) */}
                    <mesh {...sm} position={[0, 0.08, 0.18]}>
                        <boxGeometry args={[0.24, 0.22, 0.015]} />
                        {M('#1a40c8', 0.9)}
                    </mesh>
                    {/* Pocket line */}
                    <mesh {...sm} position={[0, 0.05, 0.195]}>
                        <boxGeometry args={[0.13, 0.01, 0.005]} />
                        {M('#1234a0', 0.9)}
                    </mesh>

                    {/* Overall bottom half */}
                    <mesh {...sm} position={[0, -0.1, 0]}>
                        <sphereGeometry args={[0.21, 16, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>

                    {/* Straps */}
                    <mesh {...sm} position={[-0.09, 0.28, 0.18]} rotation={[0.4, 0, -0.12]}>
                        <boxGeometry args={[0.07, 0.25, 0.025]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0.09, 0.28, 0.18]} rotation={[0.4, 0, 0.12]}>
                        <boxGeometry args={[0.07, 0.25, 0.025]} />
                        {M('#1e48d4', 0.9)}
                    </mesh>

                    {/* Gold buttons */}
                    <mesh {...sm} position={[-0.09, 0.16, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.038, 0.038, 0.018, 16]} />
                        {M('#f5c518', 0.3, 0.9)}
                    </mesh>
                    <mesh {...sm} position={[0.09, 0.16, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.038, 0.038, 0.018, 16]} />
                        {M('#f5c518', 0.3, 0.9)}
                    </mesh>

                    {/* ─── Left ARM (closer to body) ─── */}
                    <group position={[-0.26, 0.18, 0]} ref={lArmRef}>
                        {/* Upper arm */}
                        <mesh {...sm} position={[0, -0.12, 0]}>
                            <capsuleGeometry args={[0.082, 0.16, 10, 14]} />
                            {M('#db2020', 0.8)}
                        </mesh>
                        {/* Wrist cuff */}
                        <mesh {...sm} position={[0, -0.26, 0]}>
                            <cylinderGeometry args={[0.07, 0.075, 0.05, 14]} />
                            {M('#f0f0f0', 0.7)}
                        </mesh>
                        {/* Glove */}
                        <mesh {...sm} position={[0, -0.34, 0.02]}>
                            <sphereGeometry args={[0.1, 16, 16]} />
                            {M('#ffffff', 0.85)}
                        </mesh>
                    </group>

                    {/* ─── Right ARM (closer to body) ─── */}
                    <group position={[0.26, 0.18, 0]} ref={rArmRef}>
                        <mesh {...sm} position={[0, -0.12, 0]}>
                            <capsuleGeometry args={[0.082, 0.16, 10, 14]} />
                            {M('#db2020', 0.8)}
                        </mesh>
                        <mesh {...sm} position={[0, -0.26, 0]}>
                            <cylinderGeometry args={[0.07, 0.075, 0.05, 14]} />
                            {M('#f0f0f0', 0.7)}
                        </mesh>
                        <mesh {...sm} position={[0, -0.34, 0.02]}>
                            <sphereGeometry args={[0.1, 16, 16]} />
                            {M('#ffffff', 0.85)}
                        </mesh>
                    </group>

                    {/* ═══════ HEAD ═══════ */}
                    <group position={[0, 0.49, 0]} ref={headRef}>

                        {/* Head base — plain skin sphere, NO canvas texture */}
                        <mesh {...sm}>
                            <sphereGeometry args={[0.255, 20, 20]} />
                            {M('#fecc8c', 0.65)}
                        </mesh>

                        {/* ── EYES (3D meshes, placed on +Z front) ── */}
                        {/* Left eye white */}
                        <mesh {...sm} position={[-0.09, 0.06, 0.20]}>
                            <sphereGeometry args={[0.058, 14, 14]} />
                            {M('#ffffff', 0.9)}
                        </mesh>
                        {/* Left iris (blue) */}
                        <mesh {...sm} position={[-0.085, 0.055, 0.245]}>
                            <sphereGeometry args={[0.04, 12, 12]} />
                            {M('#1a6fcf', 0.8)}
                        </mesh>
                        {/* Left pupil (black) */}
                        <mesh {...sm} position={[-0.082, 0.053, 0.268]}>
                            <sphereGeometry args={[0.022, 10, 10]} />
                            {M('#0a0a0a')}
                        </mesh>
                        {/* Left eye shine */}
                        <mesh {...sm} position={[-0.072, 0.068, 0.274]}>
                            <sphereGeometry args={[0.012, 8, 8]} />
                            {M('#ffffff', 0.2)}
                        </mesh>

                        {/* Right eye white */}
                        <mesh {...sm} position={[0.09, 0.06, 0.20]}>
                            <sphereGeometry args={[0.058, 14, 14]} />
                            {M('#ffffff', 0.9)}
                        </mesh>
                        {/* Right iris */}
                        <mesh {...sm} position={[0.085, 0.055, 0.245]}>
                            <sphereGeometry args={[0.04, 12, 12]} />
                            {M('#1a6fcf', 0.8)}
                        </mesh>
                        {/* Right pupil */}
                        <mesh {...sm} position={[0.082, 0.053, 0.268]}>
                            <sphereGeometry args={[0.022, 10, 10]} />
                            {M('#0a0a0a')}
                        </mesh>
                        {/* Right eye shine */}
                        <mesh {...sm} position={[0.092, 0.068, 0.274]}>
                            <sphereGeometry args={[0.012, 8, 8]} />
                            {M('#ffffff', 0.2)}
                        </mesh>

                        {/* ── EYEBROWS (dark, thick) ── */}
                        <mesh {...sm} position={[-0.09, 0.12, 0.215]} rotation={[0, 0, 0.15]}>
                            <boxGeometry args={[0.1, 0.03, 0.03]} />
                            {M('#2a1800', 0.9)}
                        </mesh>
                        <mesh {...sm} position={[0.09, 0.12, 0.215]} rotation={[0, 0, -0.15]}>
                            <boxGeometry args={[0.1, 0.03, 0.03]} />
                            {M('#2a1800', 0.9)}
                        </mesh>

                        {/* ── NOSE (big, round, on front +Z) ── */}
                        <mesh {...sm} position={[0, -0.03, 0.24]}>
                            <sphereGeometry args={[0.09, 16, 16]} />
                            {M('#febd7a', 0.6)}
                        </mesh>
                        {/* Nose highlight */}
                        <mesh {...sm} position={[-0.02, -0.01, 0.325]}>
                            <sphereGeometry args={[0.025, 8, 8]} />
                            {M('#ffd9a0', 0.3)}
                        </mesh>

                        {/* ── MUSTACHE (3D shapes) ── */}
                        {/* Left mustache wing — pushed far forward in Z */}
                        <mesh {...sm} position={[-0.06, -0.09, 0.26]} rotation={[0.1, 0, 0.15]} scale={[1.0, 0.6, 1.2]}>
                            <sphereGeometry args={[0.07, 12, 12]} />
                            {M('#2a1800', 0.9)}
                        </mesh>
                        {/* Right mustache wing */}
                        <mesh {...sm} position={[0.06, -0.09, 0.26]} rotation={[0.1, 0, -0.15]} scale={[1.0, 0.6, 1.2]}>
                            <sphereGeometry args={[0.07, 12, 12]} />
                            {M('#2a1800', 0.9)}
                        </mesh>
                        {/* Center mustache */}
                        <mesh {...sm} position={[0, -0.11, 0.25]} scale={[0.7, 0.5, 0.8]}>
                            <sphereGeometry args={[0.05, 10, 10]} />
                            {M('#2a1800', 0.9)}
                        </mesh>

                        {/* ── EARS (sides ±X) ── */}
                        <mesh {...sm} position={[-0.245, 0.02, 0]}>
                            <sphereGeometry args={[0.075, 14, 14]} />
                            {M('#fecc8c', 0.65)}
                        </mesh>
                        <mesh {...sm} position={[0.245, 0.02, 0]}>
                            <sphereGeometry args={[0.075, 14, 14]} />
                            {M('#fecc8c', 0.65)}
                        </mesh>


                        {/* ── HAT ── */}
                        {/* Hat dome */}
                        <mesh {...sm} position={[0, 0.15, 0]} scale={[1.0, 0.82, 1.0]}>
                            <sphereGeometry args={[0.29, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                            {M('#d82020', 0.72)}
                        </mesh>
                        {/* Hat brim (disc) */}
                        <mesh {...sm} position={[0, 0.13, 0.05]} rotation={[0.05, 0, 0]}>
                            <cylinderGeometry args={[0.28, 0.28, 0.052, 16]} />
                            {M('#cc1a1a', 0.72)}
                        </mesh>
                        {/* Extended brim to front */}
                        <mesh {...sm} position={[0, 0.135, 0.16]} rotation={[0.1, 0, 0]}>
                            <boxGeometry args={[0.44, 0.05, 0.2]} />
                            {M('#cc1a1a', 0.72)}
                        </mesh>
                        {/* Cap badge (M) */}
                        <mesh {...sm} position={[0, 0.19, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.068, 0.068, 0.014, 16]} />
                            <meshStandardMaterial map={badgeTex} roughness={0.4} />
                        </mesh>
                    </group>

                </group>
            </group>
        </group>
    );
}
