// src/components/icons/BrandLogoIcon.tsx
import { cn } from '@/lib/utils';
import Image from 'next/image';
import spitespiralLogoAsset from './spitespirallogoyellow.svg';

interface BrandLogoIconProps {
  className?: string;
  style?: React.CSSProperties;
  isPriority?: boolean; // To explicitly control the priority prop of the Image component
  // Removed spreading of other props to simplify what's passed to next/image
}

export default function BrandLogoIcon({ className, style, isPriority = false }: BrandLogoIconProps) {
  return (
    <div className={cn("relative", className)} style={style}> {/* Sized, positioned container */}
      <Image
        src={spitespiralLogoAsset}
        alt="SpiteSpiral Logo"
        fill // Image fills the container div
        objectFit="contain" // Adjust as needed ('cover', 'contain', etc.)
        priority={isPriority} // Use the passed isPriority prop
        // No {...props} spread here to ensure only explicit props are passed
      />
    </div>
  );
}
