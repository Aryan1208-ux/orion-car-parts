"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { BrandLogo } from "./brand-logos";

interface BrandCard3DProps {
  make: string;
  handle: string;
}

export function BrandCard3D({ make, handle }: BrandCard3DProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [sheenPosition, setSheenPosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate subtle normalized 3D tilt angles (max 3.5 degrees)
    const rotateX = ((mouseY / height) - 0.5) * -7;
    const rotateY = ((mouseX / width) - 0.5) * 7;

    // Calculate specular light sheen position
    const sheenX = Math.round((mouseX / width) * 100);
    const sheenY = Math.round((mouseY / height) * 100);

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`);
    setSheenPosition({ x: sheenX, y: sheenY, opacity: 1 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSheenPosition({ x: 50, y: 50, opacity: 0 });
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <Link
      ref={cardRef}
      href={`/parts?make=${encodeURIComponent(handle)}`}
      className={`brand-card-3d-wrap ${isPressed ? "pressed" : ""}`}
      style={{ transform: transformStyle }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      title={`Explore Genuine ${make} Parts`}
    >
      <div className="brand-card-3d-surface">
        {/* Soft Showroom Spotlight Halo Background */}
        <div className="brand-spotlight-halo" />

        {/* Specular Light Reflection Sheen Overlay */}
        <div
          className="brand-card-sheen"
          style={{
            background: `radial-gradient(circle at ${sheenPosition.x}% ${sheenPosition.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`,
            opacity: sheenPosition.opacity,
          }}
        />

        {/* 3D Elevated Floating Logo Display Zone */}
        <div className="brand-badge-layer">
          <BrandLogo make={make} size={110} />
        </div>

        {/* Single Clean Brand Name Title */}
        <div className="brand-card-title">
          <span>{make}</span>
          <span className="brand-card-arrow">→</span>
        </div>
      </div>
    </Link>
  );
}
