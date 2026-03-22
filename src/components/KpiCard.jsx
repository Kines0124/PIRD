export default function KpiCard({ label, valor, sub, color, icon }) {
  return (
    <div style={{
      background: "#0a1628",
      border: "1px solid #0f2040",
      borderRadius: 14,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      flex: 1,
    }}>
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: 30,
        fontWeight: 800,
        color,
        fontFamily: "'Courier New', monospace",
        lineHeight: 1,
      }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
