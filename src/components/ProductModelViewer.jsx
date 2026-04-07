import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ProductModelViewer({ src, alt = "3D model" }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState(src ? "loading" : "empty");

  useEffect(() => {
    const container = mountRef.current;

    if (!src || !container) {
      setStatus("empty");
      return;
    }

    setStatus("loading");
    container.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f7);

    const width = Math.max(container.clientWidth || 0, 320);
    const height = Math.max(container.clientHeight || 0, 420);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 1.2, 3.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.target.set(0, 0.6, 0);
    controls.update();

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1.5);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(5, 64),
      new THREE.MeshBasicMaterial({ color: 0xeeeeee })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.9;
    scene.add(ground);

    const loader = new GLTFLoader();
    let model = null;
    let frameId = 0;
    let disposed = false;
    let resizeObserver = null;

    const fitModelToView = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      object.position.x -= center.x;
      object.position.y -= center.y;
      object.position.z -= center.z;

      const fittedBox = new THREE.Box3().setFromObject(object);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(fittedSize.x, fittedSize.y, fittedSize.z) || 1;

      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
      cameraZ *= 1.8;

      camera.near = Math.max(maxDim / 100, 0.01);
      camera.far = Math.max(maxDim * 100, 1000);
      camera.position.set(cameraZ * 0.35, cameraZ * 0.2, cameraZ);
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0);
      controls.minDistance = Math.max(maxDim * 0.6, 0.5);
      controls.maxDistance = Math.max(maxDim * 8, 10);
      controls.update();
    };

    loader.load(
      src,
      (gltf) => {
        if (disposed) return;

        model = gltf.scene;
        scene.add(model);
        fitModelToView(model);
        setStatus("ready");
      },
      undefined,
      (error) => {
        console.error("Failed to load 3D model:", error);
        setStatus("error");
      }
    );

    const renderLoop = () => {
      if (disposed) return;
      frameId = requestAnimationFrame(renderLoop);

      if (model) {
        model.rotation.y += 0.0035;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    renderLoop();

    const resize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth || 0, 320);
      const h = Math.max(container.clientHeight || 0, 420);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    return () => {
      disposed = true;

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      if (frameId) cancelAnimationFrame(frameId);

      controls.dispose();

      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }

        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose && m.dispose());
          } else if (obj.material.dispose) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      container.innerHTML = "";
    };
  }, [src]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "520px",
        height: "100%",
        borderRadius: "18px",
        overflow: "hidden",
        background: "#f7f7f7",
      }}
    >
      <div
        ref={mountRef}
        className="pdModelViewer"
        aria-label={alt}
        role="img"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "520px",
        }}
      />

      {status === "loading" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(247,247,247,0.75)",
            fontSize: "14px",
            color: "#555",
            pointerEvents: "none",
          }}
        >
          Loading 3D model...
        </div>
      ) : null}

      {status === "error" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#f7f7f7",
            fontSize: "14px",
            color: "#b00020",
            padding: "20px",
            textAlign: "center",
          }}
        >
          Cannot load 3D model
        </div>
      ) : null}

      {status === "empty" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#f7f7f7",
            fontSize: "14px",
            color: "#666",
          }}
        >
          No 3D model
        </div>
      ) : null}
    </div>
  );
}