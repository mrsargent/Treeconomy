// CopyableAddress.tsx
"use client";
import { useState, useRef } from "react";

interface CopyableAddressProps {
  text: string;
  children: React.ReactNode;
}

const CopyableAddress: React.FC<CopyableAddressProps> = ({ text, children }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleCopyClick = (e: React.MouseEvent) => {
    if (text && ref.current) {
      navigator.clipboard.writeText(text).then(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  return (
    <span 
      ref={ref}
      onClick={handleCopyClick}
      style={{cursor: 'pointer'}}
    >
      {children}
      {isCopied && (
        <div 
          className="tooltip tooltip-open tooltip-accent absolute" 
          style={{
            left: mousePosition.x + 'px',
            top: mousePosition.y + 'px',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span>Address Copied</span>
        </div>
      )}
    </span>
  );
};

export default CopyableAddress;