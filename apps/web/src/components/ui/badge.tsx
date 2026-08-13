import clsx from "clsx";

const RISK_STYLES: Record<string, string> = {
  LOW: "bg-low/10 text-low border-low/30",
  MEDIUM: "bg-medium/10 text-medium border-medium/30",
  HIGH: "bg-high/10 text-high border-high/30",
  CRITICAL: "bg-critical/10 text-critical border-critical/30",
};

export function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        RISK_STYLES[level] ?? "bg-muted/10 text-muted border-muted/30"
      )}
    >
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-low/10 text-low border-low/30",
    APTO: "bg-low/10 text-low border-low/30",
    ACTIVE: "bg-low/10 text-low border-low/30",
    PENDING: "bg-medium/10 text-medium border-medium/30",
    PENDENTE: "bg-medium/10 text-medium border-medium/30",
    PENDING_CONFIRMATION: "bg-medium/10 text-medium border-medium/30",
    APTO_COM_RESTRICAO: "bg-medium/10 text-medium border-medium/30",
    UNDER_REVIEW: "bg-accent/10 text-accent border-accent/30",
    EXPIRED: "bg-critical/10 text-critical border-critical/30",
    BLOQUEADO: "bg-critical/10 text-critical border-critical/30",
    REJECTED: "bg-critical/10 text-critical border-critical/30",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? "bg-muted/10 text-muted border-muted/30"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
