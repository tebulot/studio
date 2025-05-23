import { cn } from '@/lib/utils';

interface SpiralIconProps extends React.SVGProps<SVGSVGElement> {
  // any additional props if needed
}

export default function SpiralIcon({ className, ...props }: SpiralIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(className)} // Removed default animate-spin-slow
      {...props}
    >
      {/* New "bladed" spiral icon path inspired by the provided image */}
      <g stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M50 25 Q60 25 65 35 T75 50" />
        <path d="M75 50 Q75 60 65 65 T50 75" />
        <path d="M50 75 Q40 75 35 65 T25 50" />
        <path d="M25 50 Q25 40 35 35 T50 25" />
      </g>
    </svg>
  );
}
