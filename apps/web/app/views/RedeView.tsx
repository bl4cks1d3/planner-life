import type { PlannerEvent, ServiceHealth } from "@/lib/api";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function describeEvent(ev: PlannerEvent): string {
  const payload = ev.payload ?? {};
  const parts = Object.entries(payload).map(([k, v]) => `${k}: ${v}`);
  return parts.join(", ") || ev.origin;
}

const SERVICES: { key: keyof ServiceHealth; name: string; role: string }[] = [
  { key: "core", name: "Planner Core", role: "Dados, regras e barramento de eventos" },
  { key: "agent", name: "Personal Agent", role: "Harness de IA (MCP + Skills)" },
  { key: "voice", name: "Voice (Piper)", role: "TTS local em português" },
  { key: "p2pNode", name: "P2P Node", role: "libp2p + gossipsub -- publica eventos na rede PLP" },
];

export interface RedeViewProps {
  events: PlannerEvent[];
  health: ServiceHealth;
}

export default function RedeView({ events, health }: RedeViewProps) {
  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-kicker">PLP · Planner Life Protocol</div>
          <h1 className="view-title">Rede e serviços</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", borderBottom: "1px solid var(--color-divider)" }}>
        {SERVICES.map((s) => {
          const online = health[s.key];
          return (
            <div key={s.key} className="col-divider row-divider" style={{ padding: "18px 24px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16 }}>{s.name}</div>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: online ? "var(--color-accent)" : "var(--color-neutral-600)",
                  }}
                >
                  {online ? "online" : "offline"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 4 }}>{s.role}</div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Eventos recentes (PlannerEventBus)</h2>
      </div>
      {events.map((ev) => (
        <div key={ev.id} className="entry-row" style={{ fontSize: 12 }}>
          <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--color-neutral-700)" }}>
            {formatTime(ev.createdAt)}
          </span>
          <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--color-accent-700)" }}>{ev.type}</span>
          <span>{describeEvent(ev)}</span>
        </div>
      ))}
      {events.length === 0 && (
        <p className="pad-24" style={{ color: "var(--color-neutral-700)", fontSize: 14 }}>
          Nenhum evento registrado ainda.
        </p>
      )}
    </div>
  );
}
