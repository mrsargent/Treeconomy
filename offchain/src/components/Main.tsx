"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Delegate from "./Delegate";
import { useAuth } from "./AuthContext";
const Stake = dynamic(() => import("./Delegate"), { ssr: false });

export default function Main() {
  const { isSignedIn, email, address } = useAuth();
  return (
    <div className="flex">
      
        <Stake isSignedIn={isSignedIn} email={email} address={address} />
      
    </div>
  );
}
