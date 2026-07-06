import React from 'react';

interface AudioBayLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AudioBayLogo({ className = "w-10 h-10", style }: AudioBayLogoProps) {
  return (
    <svg 
      viewBox="0 0 512 512" 
      className={className} 
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="audioBayGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      {/* Nền tròn xanh lá gradient đặc trưng của thương hiệu AudioBay */}
      <circle cx="256" cy="256" r="230" fill="url(#audioBayGreenGrad)" />
      
      {/* Vòm tai nghe tối giản, thanh mảnh, đẳng cấp màu trắng */}
      <path 
        d="M 120 256 C 120 140, 392 140, 392 256" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="32" 
        strokeLinecap="round" 
      />
      
      {/* Sóng âm nhạc (Soundwaves) trung tâm sang trọng và cân đối */}
      <rect x="176" y="216" width="20" height="80" rx="10" fill="#ffffff" />
      <rect x="216" y="176" width="20" height="160" rx="10" fill="#ffffff" />
      <rect x="256" y="146" width="20" height="220" rx="10" fill="#ffffff" />
      <rect x="296" y="196" width="20" height="120" rx="10" fill="#ffffff" />
      <rect x="336" y="226" width="20" height="60" rx="10" fill="#ffffff" />
      
      {/* Đệm tai nghe (Ear pads) hai bên tinh tế và hiện đại */}
      <rect x="96" y="226" width="32" height="70" rx="16" fill="#ffffff" />
      <rect x="384" y="226" width="32" height="70" rx="16" fill="#ffffff" />
    </svg>
  );
}
