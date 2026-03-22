export default function Tag({ children, color = "#0ea5e9" }) {
  return (
    <span style={{
      background: `${color}20`,
      color,
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 20,
      whiteSpace: "nowrap",
      border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}
