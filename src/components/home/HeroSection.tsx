import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      id="admissions"
      className="relative overflow-hidden scroll-mt-24 pt-32 pb-20 lg:pt-48 lg:pb-32"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted" />
        <div className="absolute inset-0 opacity-20 dark:opacity-35 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0%,transparent_45%),radial-gradient(circle_at_80%_60%,hsl(var(--destructive))_0%,transparent_45%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="text-center lg:col-span-7 lg:text-left">
            <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Smart Information Dissemination System
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Timely, Targeted, and Secure <br />
              <span className="text-primary">Campus Information</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              A centralized platform that delivers announcements, academic
              updates, administrative services, and campus life information in
              real time — with personalized dashboards and role-based access for
              students, lecturers, and administrators.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-sm hover:opacity-90 md:text-lg"
              >
                Sign In
              </Link>
              <Link
                href="#research"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-4 text-base font-bold text-foreground hover:bg-accent md:text-lg"
              >
                View Core Modules
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--primary))_0%,transparent_45%),radial-gradient(circle_at_70%_70%,hsl(var(--destructive))_0%,transparent_45%)]" />
              <div className="relative p-10">
                <div className="mx-auto grid place-items-center rounded-2xl border border-border bg-background/60 p-10">
                  <Image
                    src="/logo.png"
                    alt="AAMUSTED IDS"
                    width={240}
                    height={240}
                    className="h-40 w-40 object-contain"
                    priority
                  />
                </div>
                <p className="mt-6 text-xs font-mono text-muted-foreground">
                  Centralized communication • web & mobile responsive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
