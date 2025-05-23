import BrandLogoIcon from '@/components/icons/BrandLogoIcon'; // Updated import
import Link from 'next/link';

export default function AppHeaderContent() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      {/* Use BrandLogoIcon for the sidebar header */}
      <BrandLogoIcon className="w-10 h-10 group-data-[state=collapsed]:w-12 group-data-[state=collapsed]:h-12 transition-all duration-300" />
      <div className="group-data-[state=collapsed]:hidden">
        <h1 className="text-3xl font-bold font-sans glitch-text">
          <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
        </h1>
      </div>
    </Link>
  );
}
