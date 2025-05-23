// src/components/icons/BrandLogoIcon.tsx
import { cn } from '@/lib/utils';

interface BrandLogoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // className is part of HTMLImageElement attributes
}

export default function BrandLogoIcon({ className, ...props }: BrandLogoIconProps) {
  return (
    <img
      src="/spitespiral-logo.svg" // Assumes you save your logo here
      alt="SpiteSpiral Logo"
      className={cn(className)}
      // You can pass width/height via className (e.g., w-28 h-28)
      // or directly as props if needed.
      {...props}
    />
  );
}
