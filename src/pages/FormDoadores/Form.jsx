import { useState } from "react";
import { mockPoints } from "../../data/points";

export default function DoadoresForm() {
  const [tipo, setTipo] = useState("");

  const inputStyle = {
    background: "#0a1628",
    border: "1px solid #0ea5e920",
    borderRadius: "8px",
    padding: "12px",
    color: "#f1f5f9",
    marginBottom: "16px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "monospace",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#475569",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "6px",
    fontFamily: "monospace",
    display: "block" 
  };

  return (
    <div className="ContainerForm" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px"
    }}>
      
      {/* Cabeçalho do Form */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#0ea5e9", fontFamily: "monospace", marginBottom: 12 }}>RECURSOS · LOGÍSTICA</div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", margin: 0, letterSpacing: -1, fontFamily: "'Courier New', monospace" }}>NOVA DOAÇÃO</h2>
      </div>

      {/* Container do Formulário */}
      <form style={{ 
        display: "flex", 
        flexDirection: "column", 
        width: "100%", 
        maxWidth: "400px",
        background: "#0a162850",
        padding: "32px",
        borderRadius: "18px",
        border: "1px solid #0ea5e910"
      }}>
        
        <label style={labelStyle}>Categoria de Item</label>
        <select
          onChange={(e) => setTipo(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#0ea5e960"}
          onBlur={(e) => e.target.style.borderColor = "#0ea5e920"}
        >
          <option value="">Selecione o tipo</option>
          <option value="Alimento">Alimento (Sólido)</option>
          <option value="Bebida">Bebida (Líquido)</option>
        </select>

        <label style={labelStyle}>Descrição do Item</label>
        <input 
          type="text" 
          placeholder="Ex: Arroz" 
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#0ea5e960"}
          onBlur={(e) => e.target.style.borderColor = "#0ea5e920"}
        />

        <label style={labelStyle}>Volume / Quantidade</label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input 
            type="number" 
            placeholder="0" 
            style={{ ...inputStyle, flex: 2 }} 
            onFocus={(e) => e.target.style.borderColor = "#0ea5e960"}
            onBlur={(e) => e.target.style.borderColor = "#0ea5e920"}
          />
          <select 
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => e.target.style.borderColor = "#0ea5e960"}
            onBlur={(e) => e.target.style.borderColor = "#0ea5e920"}
          >
            {tipo === "Bebida" ? (
              <>
                <option value="L">L</option>
                <option value="ml">ML</option>
              </>
            ) : (
              <>
                <option value="kg">KG</option>
                <option value="g">G</option>
                <option value="un">UN</option>
              </>
            )}
          </select>
        </div>

        <label style={labelStyle}>Destino da Carga</label>
        <input 
          list="locaisList" 
          type="text" 
          placeholder="Ponto de entrega" 
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#0ea5e960"}
          onBlur={(e) => e.target.style.borderColor = "#0ea5e920"}
        />
        <datalist id="locaisList">
            {mockPoints.map((ponto) => (
                <option key={ponto.id} value={ponto.name}/>
        ))}
        </datalist>

        <button 
          type="submit"
          style={{
            marginTop: "12px",
            padding: "16px",
            background: "#0ea5e915",
            border: "1px solid #0ea5e960",
            borderRadius: "12px",
            color: "#0ea5e9",
            fontWeight: "700",
            fontFamily: "monospace",
            letterSpacing: "2px",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#0ea5e930";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#0ea5e915";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          REGISTRAR DOAÇÃO
        </button>
      </form>
    </div>
  );
}