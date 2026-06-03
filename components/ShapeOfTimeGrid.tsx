"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShapeOfTimeGridCanvas } from "@/components/sketches/ShapeOfTimeGridCanvas";

export function ShapeOfTimeGrid() {
  return (
    <Suspense fallback={null}>
      <ShapeOfTimeGridInner />
    </Suspense>
  );
}

function ShapeOfTimeGridInner() {
  const searchParams = useSearchParams();
  // ?solo=1 strips page chrome (matches the main Shape of Time behavior).
  const solo = !!searchParams?.get("solo");

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (solo) {
      document.documentElement.classList.add("solo-mode");
      return () => document.documentElement.classList.remove("solo-mode");
    }
  }, [solo]);

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden" }}>
      <ShapeOfTimeGridCanvas isActive />
    </div>
  );
}
