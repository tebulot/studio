
import BrandLogoIcon from '@/components/icons/BrandLogoIcon'; // Updated import
import Link from 'next/link';

export default function AppHeaderContent() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      {/* Use BrandLogoIcon for the sidebar header */}
      {/* Updated size classes */}
      <BrandLogoIcon className="w-20 h-20 group-data-[state=collapsed]:w-24 group-data-[state=collapsed]:h-24 transition-all duration-300" />
      <div className="group-data-[state=collapsed]:hidden">
        <h1 className="text-3xl font-bold font-sans glitch-text">
          <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
        </h1>
      </div>
    </Link>
  );
}
