// components/Alert.js
import Link from 'next/link';
import React from 'react';

export interface SuccessAlertProps {
  message: string;
  onClose: () => void;
  link?: {
    href: string;
    text: string;
  }
}

const Alert = ({ message, onClose, link }: SuccessAlertProps) => {
  return (
    <div role="alert" className="alert alert-success alert-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col items-center justify-center w-full max-w-xs p-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
      {link && (       
        <a
          href={`https://preprod.cexplorer.io/tx/${link.href}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline mb-2"
        >
          {link.text}
        </a>
      )}
      <div>
        <button className="btn btn-sm" onClick={onClose}>ok</button>

      </div>
    </div>
  );
};

export default Alert;