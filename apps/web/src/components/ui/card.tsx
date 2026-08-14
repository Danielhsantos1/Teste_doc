import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "critical" | "warning";
}) {
  const toneClass =
    tone === "critical" ? "text-critical" : tone === "warning" ? "text-medium" : "text-gray-900";

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className={clsx("text-3xl font-semibold tabular-nums", toneClass)}>{value}</span>
    </Card>
  );
}
