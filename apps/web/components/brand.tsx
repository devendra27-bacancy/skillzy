export function BrandHeader({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="space-y-3">
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">{eyebrow}</p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl">
        {title}
      </h1>
      <p className="max-w-2xl text-base text-white/72 sm:text-lg">{subtitle}</p>
    </header>
  );
}
