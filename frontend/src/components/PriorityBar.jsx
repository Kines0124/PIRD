import { pct } from "../utils/geo";

export default function PriorityBar({ needed, supplied, priority }) {
  const p = pct(supplied, needed);
  const color =
    priority >= 5 ? "#ef4444" :
    priority >= 4 ? "#f97316" :
    priority >= 3 ? "#eab308" :
    "#10b981";

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#94a3b8",
        marginBottom: 4,
      }}>
        <span>{supplied} / {needed}</span>
        <span style={{ color, fontWeight: 700 }}>{p}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#1e293b" }}>
        <div style={{
          height: 5,
          borderRadius: 3,
          width: `${p}%`,
          background: color,
          transition: "width 0.6s",
        }} />
      </div>
    </div>
  );
}
