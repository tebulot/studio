import SpiralIcon from '@/components/icons/SpiralIcon';
import Link from 'next/link';

export default function AppHeaderContent() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <SpiralIcon className="w-10 h-10 text-primary group-data-[state=collapsed]:w-12 group-data-[state=collapsed]:h-12 transition-all duration-300" />
      <div className="group-data-[state=collapsed]:hidden">
        <h1 className="text-3xl font-bold text-primary glitch-text">
          SpiteSpiral
        </h1>
      </div>
    </Link>
  );
}
