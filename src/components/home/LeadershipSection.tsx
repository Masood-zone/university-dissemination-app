import Image from "next/image";
import Link from "next/link";

import styles from "./LeadershipSection.module.css";

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

type Leader = (typeof leaders)[number];

function LeaderCard({
  leader,
  duplicate = false,
}: {
  leader: Leader;
  duplicate?: boolean;
}) {
  return (
    <article
      tabIndex={duplicate ? -1 : 0}
      className="group w-[min(82vw,22rem)] shrink-0 overflow-hidden rounded-2xl border border-white/25 bg-card text-card-foreground shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl focus-visible:-translate-y-1 focus-visible:ring-4 focus-visible:ring-primary-foreground/50 focus-visible:outline-none sm:w-[22rem] lg:w-[24rem]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={leader.image}
          alt={`${leader.name}, ${leader.title}`}
          fill
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 22rem, 82vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-lg font-bold">{leader.name}</h3>
        <p className="mt-1 text-sm font-medium text-primary">{leader.title}</p>
      </div>
    </article>
  );
}

export function LeadershipSection() {
  return (
    <section
      id="leadership"
      className="scroll-mt-24 overflow-hidden bg-primary py-24 text-primary-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-foreground/85">
            University Leadership
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Meet USTED&apos;s Management
          </h2>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
            The university officers providing academic, administrative, and
            institutional leadership across USTED&apos;s campuses.
          </p>
        </div>

        <div
          role="region"
          aria-roledescription="marquee"
          aria-label="University leadership, automatically scrolling"
          className={`${styles.marquee} mt-14`}
        >
          <div className={styles.track}>
            <div className={styles.group}>
              {leaders.map((leader) => (
                <LeaderCard key={leader.name} leader={leader} />
              ))}
            </div>
            <div
              aria-hidden="true"
              className={`${styles.group} ${styles.duplicate}`}
            >
              {leaders.map((leader) => (
                <LeaderCard
                  key={`duplicate-${leader.name}`}
                  leader={leader}
                  duplicate
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-primary-foreground/70">
          Names, titles, and portraits sourced from the official{" "}
          <Link
            href="https://usted.edu.gh/management/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            USTED Management page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
