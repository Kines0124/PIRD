export default function KpiCard({ label, valor, sub, color, icon }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      flex: 1,
    }}>
      {/* top accent bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />

      <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>

      <div style={{
        fontSize: 32,
        fontWeight: 800,
        color,
        fontFamily: "var(--font-display)",
        lineHeight: 1,
        letterSpacing: "0.01em",
      }}>
        {valor}
      </div>

      <div style={{
        fontSize: 12, color: "var(--text-secondary)",
        fontWeight: 500, marginTop: 5,
        fontFamily: "var(--font-body)",
      }}>
        {label}
      </div>

      {sub && (
        <div style={{
          fontSize: 10, color: "var(--text-muted)",
          marginTop: 2, fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
