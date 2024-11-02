"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const Stake = dynamic(() => import("./Delegate"), { ssr: false });

export default function Main() {
  return (
    <div className="flex">
      <Suspense fallback={<div>Loading ... </div>}>
        <Stake />
      </Suspense>
    </div>
  );
}
