// dashboard/3DPieChart.tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface PieData {
  name: string;
  value: number;
}

interface ThreeDPieChartProps {
  data: PieData[];
  colors: string[];
  radius?: number;
  height?: number;
  segmentOffset?: number;
}

const ThreeDPieChart = ({
  data,
  colors,
  radius = 5,
  height = 1,
  segmentOffset = 0.05,
}: ThreeDPieChartProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    camera.position.z = radius * 2.5;

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const totalValue = data.reduce(
      (sum: number, entry: PieData) => sum + entry.value,
      0
    );
    let startAngle = 0;

    data.forEach((entry: PieData, index: number) => {
      const sliceAngle = (entry.value / totalValue) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, startAngle, endAngle, false);
      shape.lineTo(0, 0);

      const extrudeSettings = {
        steps: 1,
        depth: height,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors[index % colors.length]),
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.z = -height / 2;

      scene.add(mesh);
      startAngle = endAngle;
    });

    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.x = rotationRef.current.x;
      scene.rotation.y = rotationRef.current.y;
      renderer.render(scene, camera);
    };
    animate();

    const onMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = event.clientX - previousMousePosition.current.x;

      rotationRef.current.y += deltaX * 0.01;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    if (currentMount) {
      currentMount.addEventListener("mousedown", onMouseDown);
      currentMount.addEventListener("mousemove", onMouseMove);
      currentMount.addEventListener("mouseup", onMouseUp);
      currentMount.addEventListener("mouseleave", onMouseUp);
    }

    const handleResize = () => {
      if (currentMount) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      currentMount.removeEventListener("mousedown", onMouseDown);
      currentMount.removeEventListener("mousemove", onMouseMove);
      currentMount.removeEventListener("mouseup", onMouseUp);
      currentMount.removeEventListener("mouseleave", onMouseUp);
    };
  }, [data, colors, radius, height, segmentOffset]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
    ></div>
  );
};

export default ThreeDPieChart;
