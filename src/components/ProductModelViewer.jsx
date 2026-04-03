import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

function ProductModel({
  modelUrl,
  colorHex = "#ffffff",
  targetMeshNames = [],
  scale = 1.8,
}) {
  const gltf = useGLTF(modelUrl);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);

    cloned.traverse((obj) => {
      if (!obj.isMesh) return;

      obj.castShadow = true;
      obj.receiveShadow = true;

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map((m) => m.clone());
        } else {
          obj.material = obj.material.clone();
        }
      }
    });

    return cloned;
  }, [gltf]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;

      const shouldPaint =
        targetMeshNames.length === 0 || targetMeshNames.includes(obj.name);

      if (!shouldPaint) return;

      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => {
          if (mat?.color) {
            mat.color.set(colorHex);
            mat.needsUpdate = true;
          }
        });
      } else if (obj.material.color) {
        obj.material.color.set(colorHex);
        obj.material.needsUpdate = true;
      }
    });
  }, [scene, colorHex, targetMeshNames]);

  return <primitive object={scene} scale={scale} position={[0, -1, 0]} />;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function ProductModelViewer({
  modelUrl,
  colorHex,
  targetMeshNames = [],
  onError,
}) {
  if (!modelUrl) {
    return <div className="pdEmptyImage">No 3D model</div>;
  }

  return (
    <div className="pdModelWrap">
      <Canvas camera={{ position: [0, 0.8, 4], fov: 40 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <ErrorBoundary onError={onError}>
            <ProductModel
              modelUrl={modelUrl}
              colorHex={colorHex}
              targetMeshNames={targetMeshNames}
            />
          </ErrorBoundary>
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} />
      </Canvas>
    </div>
  );
}