import Image from 'next/image';

type BrandLockupProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function BrandLockup({ compact = false, inverse = false, className = '' }: BrandLockupProps) {
  const wordmark = inverse
    ? 'bg-[linear-gradient(105deg,#D69B04_0%,#99BC0D_36%,#55C7E8_68%,#FFF7F4_100%)]'
    : 'bg-[linear-gradient(105deg,#147115_0%,#99BC0D_28%,#D69B04_51%,#0291C0_76%,#012044_100%)]';
  const productMark = inverse
    ? 'bg-[linear-gradient(100deg,#99BC0D_0%,#55C7E8_50%,#D69B04_100%)]'
    : 'bg-[linear-gradient(100deg,#012044_0%,#036A97_30%,#0291C0_55%,#147115_76%,#D69B04_100%)]';

  return (
    <div className={`flex items-center gap-2.5 text-left ${className}`}>
      <Image
        src="/brand/ferixas-globe.png"
        alt="Ferixas globe and ribbon mark"
        width={compact ? 38 : 48}
        height={compact ? 38 : 48}
        priority
        className="h-auto shrink-0 object-contain"
      />
      <div className="min-w-0 leading-none">
        <span className={`block bg-clip-text text-transparent font-extrabold tracking-[-0.06em] ${compact ? 'text-base' : 'text-xl'} ${wordmark}`}>Ferixas</span>
        <span className={`mt-1 block bg-clip-text text-transparent font-extrabold uppercase tracking-[0.14em] ${compact ? 'text-[7px]' : 'text-[8px]'} ${productMark}`}>AsaforVTU</span>
      </div>
    </div>
  );
}
