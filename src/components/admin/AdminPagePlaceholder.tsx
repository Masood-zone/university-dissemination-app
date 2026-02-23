type AdminPagePlaceholderProps = {
  title: string;
  description: string;
};

export default function AdminPagePlaceholder({
  title,
  description,
}: AdminPagePlaceholderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h1 className="font-lexend text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
