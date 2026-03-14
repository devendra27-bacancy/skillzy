export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5ff] px-6 text-center text-[#1a1630]">
      <img
        src="/branding/skillzy-mascot-full.svg"
        alt="Skillzy mascot"
        className="h-28 w-28"
      />
      <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-[#8f84ac]">
        Skillzy
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Loading your classroom</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#6d6585]">
        Getting your lessons, classes, and live session workspace ready.
      </p>
      <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-[#e9e2ff]">
        <div className="loading-brand-bar h-full w-1/2 rounded-full bg-[#8b62ff]" />
      </div>
    </div>
  );
}
