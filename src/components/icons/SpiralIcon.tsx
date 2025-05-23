import { cn } from '@/lib/utils';

interface SpiralIconProps extends React.SVGProps<SVGSVGElement> {
  // any additional props if needed
}

export default function SpiralIcon({ className, ...props }: SpiralIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("animate-spin-slow", className)} // Uses Tailwind animation utility
      {...props}
    >
      <path
        d="M50 50
           A5 5 0 0 1 55 50
           A10 10 0 0 1 45 50
           A15 15 0 0 1 60 50
           A20 20 0 0 1 40 50
           A25 25 0 0 1 65 50
           A30 30 0 0 1 35 50
           A35 35 0 0 1 70 50
           A40 40 0 0 1 30 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="5" // Adjusted for better visibility
        strokeLinecap="round"
      />
    </svg>
  );
}
