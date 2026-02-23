export function StatsSection() {
  const stats = [
    { value: "8", label: "Core modules integrated" },
    { value: "4", label: "Roles supported" },
    { value: "Real-time", label: "Push + in-app alerts" },
    { value: "RBAC", label: "Secure access control" },
  ] as const;

  return (
    <section
      id="academics"
      className="bg-primary py-12 text-primary-foreground scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
