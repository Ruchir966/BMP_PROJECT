import { ReactNode } from "react";
import { Logo } from "./Logo";

export const AuthLayout = ({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="container relative z-10 flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
          {/* Left — brand panel */}
          <section className="hidden flex-col gap-8 lg:flex">
            <Logo size={56} />
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
                Grow smarter with technology
              </h1>
              <p className="mt-4 max-w-md text-base text-muted-foreground">
                Monitor current, voltage and power across every sensor node in your fields. Spot
                anomalies instantly with smart benchmarks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: "24/7", v: "Monitoring" },
                { k: "Live", v: "Averages" },
                { k: "Smart", v: "Alerts" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft backdrop-blur"
                >
                  <p className="font-display text-xl font-bold text-primary">{s.k}</p>
                  <p className="text-xs text-muted-foreground">{s.v}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right — form card */}
          <section className="animate-scale-in">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Logo size={44} />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-elevated backdrop-blur-xl">
              <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
