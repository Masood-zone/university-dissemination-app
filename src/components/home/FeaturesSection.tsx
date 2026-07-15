import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function FeaturesSection() {
  const cards = [
    {
      icon: "account_balance",
      title: "About USTED",
      description:
        "Learn how USTED advances TVET, entrepreneurial development, industry-ready skills, and teacher education in Ghana.",
      cta: "Discover the University",
      href: "https://usted.edu.gh/about/",
    },
    {
      icon: "school",
      title: "Programmes & Admissions",
      description:
        "Explore undergraduate and graduate programmes across USTED's Kumasi and Asante-Mampong campuses, with routes into technical, vocational, business, and teacher education.",
      cta: "Explore USTED Programmes",
      href: "https://usted.edu.gh/list_of_programmes/",
    },
    {
      icon: "local_library",
      title: "Digital Library & Research",
      description:
        "Access USTED research databases, e-books, the library catalogue, institutional research, tutorials, and off-campus learning resources.",
      cta: "Visit the USTED Library",
      href: "https://usted.edu.gh/library/",
    },
  ] as const;

  return (
    <section id="usted" className="scroll-mt-24 bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Discover USTED Ghana
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Ghana&apos;s foremost TVET and Entrepreneurship Teacher Education
            university, developing practical skills, innovation, and
            industry-ready professionals.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${c.title} on the official USTED website (opens in a new tab)`}
              className="group flex min-h-96 flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <MaterialSymbol icon={c.icon} />
              </div>
              <h3 className="mb-3 text-xl font-bold">{c.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {c.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:underline">
                {c.cta}
                <MaterialSymbol icon="open_in_new" className="text-base" />
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Information and resources are provided by the official USTED website.
        </p>
      </div>
    </section>
  );
}
