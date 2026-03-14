import clsx from "clsx";
import type { ReactNode } from "react";

export function AppShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={clsx("mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6", className)}>
      {children}
    </main>
  );
}

export function CreamCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "cream-panel relative rounded-[2rem] p-5 text-skillzy-ink shadow-card",
        className
      )}
    >
      {children}
    </section>
  );
}
