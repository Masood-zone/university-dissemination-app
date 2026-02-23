import Image from "next/image";

type TeamMember = {
  name: string;
  indexNumber: string;
  role: string;
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
  <rect width="128" height="128" rx="64" fill="url(#g)"/>
  <text x="64" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#ffffff" font-weight="700">${initials}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function TeamSection() {
  const members: TeamMember[] = [
    {
      name: "Badu Adwoa Ntiriwaa",
      indexNumber: "5221040008",
      role: "Developer",
    },
    {
      name: "Appiah Justice Barfo",
      indexNumber: "5221040041",
      role: "Developer",
    },
    {
      name: "Theophilus King Asare",
      indexNumber: "5201040297",
      role: "Developer",
    },
    {
      name: "Asare Edmund Bediako",
      indexNumber: "N/A",
      role: "Developer",
    },
  ];

  return (
    <section className="bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">Information Dissemination</h2>
            <p className="mt-2 text-muted-foreground">
              Meet the team members who came together to develop this app.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((m) => (
            <div
              key={m.indexNumber + m.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={avatarSvgDataUri(m.name)}
                  alt={m.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
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
