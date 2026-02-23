import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function FeaturesSection() {
  const cards = [
    {
      icon: "school",
      title: "Student Dashboard",
      description:
        "Access course registration, academic records, timetable, and fee status in a unified interface.",
      cta: "Launch Dashboard",
      href: "/student",
    },
    {
      icon: "assignment_ind",
      title: "Lecturer Portal",
      description:
        "Manage course assignments, upload learning materials, and record marks with our database-driven UI.",
      cta: "Login Portal",
      href: "/lecturer",
    },
    {
      icon: "admin_panel_settings",
      title: "Admin Console",
      description:
        "Complete oversight of institutional data, permissions, and departmental administration.",
      cta: "Secure Access",
      href: "/administrator",
    },
  ] as const;

  return (
    <section id="research" className="bg-background py-24 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Unified ERP Environment
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Role-based access tailored for every member of our community.
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
