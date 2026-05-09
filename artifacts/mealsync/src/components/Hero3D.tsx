import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Float, 
  Text, 
  PerspectiveCamera, 
  useFBX, 
  Environment, 
  ContactShadows,
  Html,
  useProgress
} from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 w-32">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Loading 3D...
        </span>
      </div>
    </Html>
  );
}

function FoodContainerModel() {
  const fbx = useFBX("/models/food-container.fbx");
  const groupRef = useRef<THREE.Group>(null);

  // Apply custom material to make it look premium
  fbx.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshStandardMaterial({
        color: "#10b981",
        roughness: 0.1,
        metalness: 0.8,
        emissive: "#059669",
        emissiveIntensity: 0.2,
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <primitive 
        object={fbx} 
        scale={0.08} // Increased scale significantly
        ref={groupRef}
        position={[0, -1, 0]} // Center it slightly lower
        rotation={[0, Math.PI / 4, 0]}
      />
    </Float>
  );
}


function Ecosystem() {
  return (
    <group>
      <FoodContainerModel />
      
      {/* Floating Labels */}
      <Text
        position={[2, 1, 0]}
        fontSize={0.25}
        color="#10b981"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
      >
        Surplus
      </Text>
      <Text
        position={[-2, -1, 0]}
        fontSize={0.25}
        color="#3b82f6"
      >
        Redistributed
      </Text>

      {/* Decorative Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Float key={i} speed={1} rotationIntensity={2} floatIntensity={2}>
          <mesh position={[
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
          ]}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-[400px] md:h-[600px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
          
          <Ecosystem />
          
          <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
          <Environment preset="city" />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -z-10" />
    </div>
  );
}

