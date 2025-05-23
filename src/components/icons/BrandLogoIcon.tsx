// src/components/icons/BrandLogoIcon.tsx
import { cn } from '@/lib/utils';
import Image from 'next/image';
import spitespiralLogoAsset from './spitespirallogo.svg'; // Import the SVG asset

interface BrandLogoIconProps {
  className?: string; // This className will size the outer div
  // Add other props if needed by the Image component, e.g., priority
}

export default function BrandLogoIcon({ className, ...props }: BrandLogoIconProps) {
  return (
    <div className={cn("relative", className)}> {/* Sized, positioned container */}
      <Image
        src={spitespiralLogoAsset} // Pass the imported asset object here
        alt="SpiteSpiral Logo"
        layout="fill" // Image fills the container div
        objectFit="contain" // Adjust as needed ('cover', 'contain', etc.)
        priority // Add priority if this is an LCP element, e.g., on the homepage
        {...props} // Pass through any other relevant props
      />
    </div>
  );
}
