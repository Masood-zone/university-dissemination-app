import Image from "next/image";
import Link from "next/link";

const leaders = [
  {
    name: "Prof. Frederick Kwaku Sarfo",
    title: "Vice-Chancellor",
    image: "/leadership/frederick-sarfo.png",
  },
  {
    name: "Prof. Isaac Boateng",
    title: "Pro Vice-Chancellor",
    image: "/leadership/isaac-boateng.png",
  },
  {
    name: "Mr. Augustus Kwaw Brew",
    title: "Registrar",
    image: "/leadership/augustus-brew.png",
  },
  {
    name: "Prof. Isaac Abunyuwah",
    title: "Principal, Mampong Campus",
    image: "/leadership/isaac-abunyuwah.png",
  },
  {
    name: "Dr. Chris M. Owusu-Ansah",
    title: "University Librarian",
    image: "/leadership/chris-owusu-ansah.png",
  },
  {
    name: "Dr. Isaac Marfo Oduro",
    title: "Ag. Director of Internal Audit",
    image: "/leadership/isaac-marfo-oduro.png",
  },
] as const;

export function LeadershipSection() {
  return (
    <section id="leadership" className="scroll-mt-24 bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            University Leadership
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Meet USTED&apos;s Management
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The university officers providing academic, administrative, and
            institutional leadership across USTED&apos;s campuses.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((leader) => (
            <article
              key={leader.name}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={leader.image}
                  alt={`${leader.name}, ${leader.title}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold">{leader.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{leader.title}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Names, titles, and portraits sourced from the official{" "}
          <Link
            href="https://usted.edu.gh/management/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            USTED Management page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
