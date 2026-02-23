import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function FeaturesSection() {
  const cards = [
    {
      icon: "school",
      title: "Academic Information",
      description:
        "Access admissions info, timetables, room locations, examination schedules, and the academic calendar in one place.",
      cta: "Sign in to access",
      href: "/login",
    },
    {
      icon: "notifications",
      title: "Announcements & Notifications",
      description:
        "Receive targeted updates (old affairs, current affairs, departmental) with search and archives — plus notification preferences.",
      cta: "See how it works",
      href: "#academics",
    },
    {
      icon: "admin_panel_settings",
      title: "Administrative & Campus Services",
      description:
        "Check fee and registration status, access digital student ID, and view campus life info like events, maps, library resources, and transport schedules.",
      cta: "Explore modules",
      href: "#e-resources",
    },
  ] as const;

  return (
    <section id="research" className="bg-background py-24 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Core Modules of SIDS
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Built to reduce missed information and improve campus communication.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <MaterialSymbol icon={c.icon} />
              </div>
              <h3 className="mb-3 text-xl font-bold">{c.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
              <Link
                href={c.href}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                {c.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
