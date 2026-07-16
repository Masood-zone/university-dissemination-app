import Image from "next/image";

type TeamMember = {
  name: string;
  indexNumber: string;
  role: string;
  profile?: string;
};

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "U";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";

  return `${first}${last}`.toUpperCase();
}

function avatarSvgDataUri(label: string): string {
  const initials = getInitials(label);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#g)"/>
  <text x="64" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#ffffff" font-weight="700">${initials}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function TeamSection() {
  const members: TeamMember[] = [
    {
      name: "Badu Adwoa Ntiriwaa",
      indexNumber: "5221040008",
      role: "UI/UX Designer",
    },
    {
      name: "Appiah Justice Barfo",
      indexNumber: "5221040041",
      role: "Quality Assurance and Tester",
    },
    {
      name: "Theophilus King Asare",
      indexNumber: "5201040297",
      role: "Project Lead and Manager",
      // profile: "/king.jpeg",
    },
    {
      name: "Asare Edmund Bediako",
      indexNumber: "5221040017",
      role: "Frontend Developer",
    },
    {
      name: "Kyei Gyamfi Solomon",
      indexNumber: "5221040042",
      role: "Backend Developer",
      // profile: "/solomon.jpeg",
    },
  ];

  return (
    <section id="about-us" className="bg-muted/40 py-24 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">About the Project</h2>
            <p className="mt-2 text-muted-foreground">
              This Smart Information Dissemination System centralizes academic,
              administrative, and campus-life communication into a secure,
              personalized platform.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((m) => (
            <div
              key={m.indexNumber + m.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <Image
                  src={m.profile ?? avatarSvgDataUri(m.name)}
                  alt={m.name}
                  width={144}
                  height={144}
                  className="h-36 w-36 rounded-2xl object-cover"
                  unoptimized
                />

                <div className="mt-4">
                  <p className="text-base font-bold leading-snug wrap-break-word">
                    {m.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Index Number
                </p>
                <p className="mt-1 text-sm font-bold">{m.indexNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
