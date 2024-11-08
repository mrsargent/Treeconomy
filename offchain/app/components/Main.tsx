"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Delegate from "./Delegate";
const Stake = dynamic(() => import("./Delegate"), { ssr: false });

export default function Main() {
  return (
    <div className="flex">
      
        <Stake />
      
    </div>
  );
}
