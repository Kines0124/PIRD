import { useEffect, useRef, useState } from "react";
import { FaCalendarDays }          from "react-icons/fa6";
import { LuNotebookPen }           from "react-icons/lu";
import { BsBox2HeartFill }         from "react-icons/bs";
import { IoPeople }                from "react-icons/io5";
import { FaStaffSnake }            from "react-icons/fa6";


// ---------------------------------------------------------------------------
// Geração do PDF (client-side, sem dependência de backend)
// ---------------------------------------------------------------------------
async function generateEventReport({ event, specialists, collectionPoints, selectedFotos = [] }) {
  const { jsPDF } = await import("jspdf");

  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W      = doc.internal.pageSize.getWidth();
  const H      = doc.internal.pageSize.getHeight();
  const MARGIN = 16;
  const CW     = W - MARGIN * 2;   // largura útil
  const ROW_H  = 10;               // altura de cada linha de campo
  let y = 0;

  // ── helpers ────────────────────────────────────────────────────────────────

  const hex2rgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  const fillRect = (x, fy, w, h, hex) => {
    doc.setFillColor(...hex2rgb(hex));
    doc.rect(x, fy, w, h, "F");
  };

  const divider = (dy) => {
    doc.setDrawColor(...hex2rgb("#e2e8f0"));
    doc.setLineWidth(0.25);
    doc.line(MARGIN, dy, W - MARGIN, dy);
  };

  /**
   * Desenha um par label + valor ocupando a largura total.
   * O label fica em cinza pequeno acima do valor.
   * Avança `y` pelo espaço consumido e retorna o novo y.
   */
  const field = (label, value, curY) => {
    const val = String(value ?? "—");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), MARGIN, curY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    // Quebra automática se o valor for longo
    const lines = doc.splitTextToSize(val, CW);
    doc.text(lines, MARGIN, curY + 5);
    return curY + 5 + lines.length * 5 + 3;  // label + valor + espaço
  };

  /**
   * Dois campos lado a lado. Cada metade tem largura CW/2 - 4mm de gap.
   * Usa splitTextToSize com largura da metade para evitar sobreposição.
   */
  const fieldRow = (leftLabel, leftVal, rightLabel, rightVal, curY) => {
    const half = CW / 2 - 4;
    const midX = MARGIN + CW / 2 + 4;

    // labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(leftLabel.toUpperCase(), MARGIN, curY);
    doc.text(rightLabel.toUpperCase(), midX, curY);

    // valores
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const lLines = doc.splitTextToSize(String(leftVal ?? "—"), half);
    const rLines = doc.splitTextToSize(String(rightVal ?? "—"), half);
    doc.text(lLines, MARGIN, curY + 5);
    doc.text(rLines, midX, curY + 5);

    const maxLines = Math.max(lLines.length, rLines.length);
    return curY + 5 + maxLines * 5 + 3;
  };

  /** Cabeçalho de seção com fundo cinza claro */
  const sectionHeader = (title, curY) => {
    fillRect(MARGIN, curY, CW, 7, "#f1f5f9");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(title, MARGIN + 3, curY + 5);
    return curY + 11;
  };

  /** Garante que há ao menos `needed` mm até o fim da página */
  const ensureSpace = (needed, curY) => {
    if (curY + needed > H - 18) {
      doc.addPage();
      return 20;
    }
    return curY;
  };

  // ── cálculos de datas e duração ──────────────────────────────────────────────
  // date   = "dd/MM/yyyy"          (tabela — sem hora)
  // dataFim = "dd/MM/yyyy HH:mm"   (relatório — com hora, adicionado ao EventoGetDTO)
  // Para duração precisamos de objetos Date; parseamos o formato brasileiro.
  const parseBR = (str) => {
    if (!str) return null;
    // Aceita "dd/MM/yyyy HH:mm", "dd/MM/yyyy" e ISO (fallback)
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}):(\d{2}))?/);
    if (m) {
      const [, d, mo, y, h = "00", min = "00"] = m;
      return new Date(`${y}-${mo}-${d}T${h}:${min}:00`);
    }
    const iso = new Date(str);
    return isNaN(iso) ? null : iso;
  };

  // Exibe data+hora quando disponível, só data como fallback
  const fmtDate = (str) => {
    if (!str) return "—";
    const d = parseBR(str);
    if (!d) return str;
    // Se a string original já tem hora, exibe com hora
    if (/\d{2}:\d{2}/.test(str)) {
      return d.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const rawStart = event.dataFim   // dataFim existe → usar dataInicio do backend também
    ? event.date                   // "date" = dataInicio formatado pelo EventoGetDTO
    : event.date;
  const rawEnd = event.dataFim;

  let duracao = "—";
  const dtStart = parseBR(rawStart);
  const dtEnd   = parseBR(rawEnd);
  if (dtStart && dtEnd) {
    const ms = dtEnd - dtStart;
    if (ms >= 0) {
      const dias = Math.floor(ms / 86_400_000);
      const hrs  = Math.floor((ms % 86_400_000) / 3_600_000);
      const min  = Math.floor((ms % 3_600_000)  / 60_000);
      if (dias > 0)     duracao = `${dias}d ${hrs}h ${min}min`;
      else if (hrs > 0) duracao = `${hrs}h ${min}min`;
      else if (min > 0) duracao = `${min} minutos`;
      else              duracao = "menos de 1 minuto";
    }
  }

  // ── dados derivados ────────────────────────────────────────────────────────
  const eventSpecialists = (specialists ?? []).filter(
    (s) => s._linkedToEvent === true || s.linkedEventId === event.id
  );

  const eventPoints = (collectionPoints ?? []).filter((p) =>
    (event.nearbyCollectionIds ?? []).includes(p.id)
  );

  const proto = `DC-${event.id ?? "0000"}-${new Date().getFullYear()}`;

  // ── CABEÇALHO ──────────────────────────────────────────────────────────────
  fillRect(0, 0, W, 34, "#0f172a");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("RELATÓRIO OFICIAL DE EVENTO", MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Defesa Civil — Sistema de Gestão de Desastres", MARGIN, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(99, 179, 237);
  doc.text(`Protocolo: ${proto}`, W - MARGIN, 22, { align: "right" });

  y = 42;

  // ── IDENTIFICAÇÃO ──────────────────────────────────────────────────────────
  y = sectionHeader("IDENTIFICAÇÃO DO EVENTO", y);

  y = field("Título", event.title ?? event.titulo, y);
  y = fieldRow("Tipo", event.type ?? event.tipo,
               "Severidade", (event.severity ?? event.severidade ?? "—").toUpperCase(), y);
  y = fieldRow("Data de Início",    fmtDate(rawStart),
               "Data de Encerramento", fmtDate(rawEnd), y);
  y = fieldRow("Duração", duracao,
               "Vítimas Estimadas", String(event.victims ?? event.vitimasEstimadas ?? 0), y);
  y += 4;
  divider(y); y += 6;

  // ── LOCALIZAÇÃO ────────────────────────────────────────────────────────────
  y = sectionHeader("LOCALIZAÇÃO", y);

  // O endereço completo pode conter "Rua X, Bairro, Cidade - UF, CEP, País"
  // Exibimos em uma linha full-width para evitar sobreposição
  y = field("Endereço Completo", event.address ?? event.endereco, y);
  y = field("Município / UF", event.city ?? event.cidade, y);
  y += 4;
  divider(y); y += 6;

  // ── DESCRIÇÃO ──────────────────────────────────────────────────────────────
  const desc = event.description ?? event.descricao;
  if (desc) {
    y = ensureSpace(30, y);
    y = sectionHeader("DESCRIÇÃO", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(desc, CW);
    doc.text(descLines, MARGIN, y);
    y += descLines.length * 5 + 6;
    divider(y); y += 6;
  }

  // ── ESPECIALISTAS ──────────────────────────────────────────────────────────
  y = ensureSpace(28, y);
  y = sectionHeader(`ESPECIALISTAS QUE ATUARAM (${eventSpecialists.length})`, y);

  if (eventSpecialists.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhum especialista registrado para este evento.", MARGIN, y);
    y += 8;
  } else {
    // Cabeçalho da tabela
    fillRect(MARGIN, y - 1, CW, 7, "#e2e8f0");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("NOME",      MARGIN + 2,  y + 4.5);
    doc.text("PROFISSÃO", MARGIN + 68, y + 4.5);
    doc.text("UF",        MARGIN + 148, y + 4.5);
    y += 9;

    eventSpecialists.forEach((s, idx) => {
      y = ensureSpace(8, y);
      if (idx % 2 === 0) fillRect(MARGIN, y - 1, CW, 7, "#f8fafc");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      // Nome: pode ser longo — trunca com splitTextToSize na coluna
      const nomeLines = doc.splitTextToSize(s.nome ?? s.name ?? "—", 62);
      doc.text(nomeLines[0], MARGIN + 2,  y + 4);     // só 1ª linha para manter tabela
      doc.text(doc.splitTextToSize(s.profissao ?? "—", 76)[0], MARGIN + 68, y + 4);
      doc.text(s.uf ?? "—", MARGIN + 148, y + 4);
      y += 7;
    });
    y += 4;
  }

  divider(y); y += 6;

  // ── PONTOS DE COLETA ───────────────────────────────────────────────────────
  y = ensureSpace(28, y);
  y = sectionHeader(`PONTOS DE COLETA ASSOCIADOS (${eventPoints.length})`, y);

  if (eventPoints.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhum ponto de coleta associado.", MARGIN, y);
    y += 8;
  } else {
    // Tabela de 2 colunas: Nome | Endereço (mais espaço)
    fillRect(MARGIN, y - 1, CW, 7, "#e2e8f0");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("NOME",     MARGIN + 2,  y + 4.5);
    doc.text("ENDEREÇO", MARGIN + 58, y + 4.5);
    y += 9;

    eventPoints.forEach((p, idx) => {
      y = ensureSpace(8, y);
      if (idx % 2 === 0) fillRect(MARGIN, y - 1, CW, 7, "#f8fafc");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const nomePC = doc.splitTextToSize(p.name ?? p.nomeLocal ?? p.nome ?? "—", 52);
      const endPC  = doc.splitTextToSize(p.address ?? p.endereco ?? "—", 108);
      doc.text(nomePC[0], MARGIN + 2,  y + 4);
      doc.text(endPC[0],  MARGIN + 58, y + 4);
      y += 7;
    });
    y += 4;
  }

  // ── FOTOS ──────────────────────────────────────────────────────────────────
  if (selectedFotos.length > 0) {
    y = ensureSpace(28, y);
    divider(y); y += 6;
    y = sectionHeader(`REGISTROS FOTOGRÁFICOS (${selectedFotos.length})`, y);

    const IMG_W   = (CW - 6) / 2;   // 2 fotos por linha com gap de 6mm
    const IMG_H   = IMG_W * 0.65;   // proporção ~3:2
    const GAP_COL = 6;
    const GAP_ROW = 6;

    for (let i = 0; i < selectedFotos.length; i += 2) {
      y = ensureSpace(IMG_H + GAP_ROW + 10, y);
      const col2 = selectedFotos[i + 1];

      // Carrega imagens via HTMLImageElement → canvas → base64
      const toBase64 = async (fotoUrl) => {
        try {
          const publicBase = "https://pub-a19728e3da19420992e3f8c68ef17b50.r2.dev";
          const chave = fotoUrl.replace(publicBase + "/", "");
          const proxyUrl = `http://localhost:8080/proxy/foto?chave=${encodeURIComponent(chave)}`;

          const token = sessionStorage.getItem("admin_token");
          const res = await fetch(proxyUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload  = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
        } catch { return null; }
      };

      const fmt = "JPEG"; // canvas.toDataURL sempre devolve JPEG aqui

      const b64a = await toBase64(selectedFotos[i].fotoUrl);
      const b64b = col2 ? await toBase64(col2.fotoUrl) : null;

      if (b64a) doc.addImage(b64a, fmt, MARGIN,                    y, IMG_W, IMG_H);
      if (b64b) doc.addImage(b64b, fmt, MARGIN + IMG_W + GAP_COL, y, IMG_W, IMG_H);

      // Legendas
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const capA = selectedFotos[i].nomeArquivo || `Foto ${i + 1}`;
      const capB = col2 ? (col2.nomeArquivo || `Foto ${i + 2}`) : null;
      doc.text(doc.splitTextToSize(capA, IMG_W)[0], MARGIN,                          y + IMG_H + 4);
      if (capB) doc.text(doc.splitTextToSize(capB, IMG_W)[0], MARGIN + IMG_W + GAP_COL, y + IMG_H + 4);

      y += IMG_H + GAP_ROW + 8;
    }
    y += 4;
  }

  // ── RODAPÉ em todas as páginas ─────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const fy = H - 10;
    doc.setDrawColor(...hex2rgb("#e2e8f0"));
    doc.setLineWidth(0.25);
    doc.line(MARGIN, fy - 3, W - MARGIN, fy - 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")} · ${proto}`, MARGIN, fy);
    doc.text(`Página ${i} de ${pageCount}`, W - MARGIN, fy, { align: "right" });
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Modal de encerramento
// ---------------------------------------------------------------------------
export default function EventClosureModal({
  event,
  specialists = [],
  collectionPoints = [],
  convocacoes = [],
  fotos = [],
  onClose,
}) {
  const [loading,       setLoading]       = useState(false);
  const [done,          setDone]          = useState(false);
  const [selectedFotos, setSelectedFotos] = useState([]);
  const overlayRef = useRef(null);

  // Seleciona/deseleciona foto pelo id
  function toggleFoto(foto) {
    setSelectedFotos(prev =>
      prev.find(f => f.id === foto.id)
        ? prev.filter(f => f.id !== foto.id)
        : [...prev, foto]
    );
  }

  // Especialistas que atuaram: usa snapshot de convocacoes passado pelo pai,
  // capturado ANTES de chamar onSaveEvent. Isso garante que os status originais
  // (pendente/a_caminho/no_local) ainda estão presentes mesmo que o backend
  // já os tenha movido para 'recusado' ao encerrar o evento.
  const linkedSpecialists = (() => {
    const convDoEvento = convocacoes.filter(
      c => String(c.eventoId) === String(event.id) && c.status !== "recusado"
    );
    if (convDoEvento.length > 0) {
      return convDoEvento.map(c => {
        const match = specialists.find(
          s => (s.especialistaId ?? s.id) === c.especialistaId
        );
        return {
          nome:      c.especialistaNome      ?? match?.nome      ?? "—",
          profissao: c.especialistaProfissao ?? match?.profissao ?? "—",
          uf:        c.especialistaUf        ?? match?.uf        ?? "—",
          _linkedToEvent: true,
        };
      });
    }
    return specialists.filter(s => s._linkedToEvent === true);
  })();

  // Fecha ao clicar no overlay
  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Fecha com Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const doc = await generateEventReport({ event, specialists: linkedSpecialists, collectionPoints, selectedFotos });
      const safeTitle = (event.title ?? event.titulo ?? "evento")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")   // remove acentos
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      doc.save(`relatorio_${safeTitle}_${event.id ?? ""}.pdf`);
      setDone(true);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o relatório: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          animation: "closureIn 0.22s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Faixa de status */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}><LuNotebookPen/></span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#f1f5f9",
                  letterSpacing: "-0.01em",
                }}
              >
                Evento Encerrado
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                {event.title ?? event.titulo}
              </div>
            </div>
          </div>

          {/* Resumo em chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {[
              { icon: <FaCalendarDays />, label: event.date ?? event.dataInicio ?? "—" },
              { icon: <FaStaffSnake style={{color:"#22c55e"}}/>, label: `${linkedSpecialists.length} especialistas` },
              { icon: <BsBox2HeartFill style={{color:"#3B82F6"}}/>, label: `${(event.nearbyCollectionIds ?? []).length} pontos de coleta` },
              { icon: <IoPeople style={{color:"#F5C518"}}/>, label: `${event.victims ?? event.vitimasEstimadas ?? 0} vítimas` },
            ].map((chip, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 99,
                  padding: "3px 10px",
                  fontSize: 10.5,
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {chip.icon} {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "20px 24px" }}>
          {!done ? (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                  margin: "0 0 20px",
                }}
              >
                O evento foi marcado como <strong style={{ color: "var(--text-primary)" }}>encerrado</strong>.
                Deseja emitir o <strong style={{ color: "var(--text-primary)" }}>Relatório Oficial</strong> com
                data, duração, localização, vítimas, especialistas que atuaram e
                pontos de coleta associados?
              </p>

              {/* Preview do conteúdo */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                  Conteúdo do relatório
                </div>
                {[
                  "Identificação e protocolo do evento",
                  "Data de início, encerramento e duração",
                  "Localização completa (endereço, cidade, coordenadas)",
                  "Número estimado de vítimas",
                  "Relação nominal de especialistas e profissões",
                  "Pontos de coleta ativos durante o evento",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ color: "#22c55e", fontSize: 11, flexShrink: 0 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Seletor de fotos */}
              {fotos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Fotos para o relatório
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setSelectedFotos([...fotos])}
                        style={{ fontSize: 11, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, padding: 0 }}
                      >
                        Todas
                      </button>
                      <span style={{ color: "var(--border)", fontSize: 11 }}>|</span>
                      <button
                        onClick={() => setSelectedFotos([])}
                        style={{ fontSize: 11, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600, padding: 0 }}
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {fotos.map(foto => {
                      const sel = !!selectedFotos.find(f => f.id === foto.id);
                      return (
                        <div
                          key={foto.id}
                          onClick={() => toggleFoto(foto)}
                          style={{
                            position: "relative", cursor: "pointer", borderRadius: 8, overflow: "hidden",
                            border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                            transition: "border-color 0.15s",
                            aspectRatio: "3 / 2",
                          }}
                        >
                          <img
                            src={foto.fotoUrl}
                            alt={foto.nomeArquivo || "Foto"}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          {/* Overlay de seleção */}
                          <div style={{
                            position: "absolute", inset: 0,
                            background: sel ? "rgba(222,57,63,0.18)" : "rgba(0,0,0,0.0)",
                            transition: "background 0.15s",
                            display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                            padding: 5,
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: "50%",
                              background: sel ? "var(--accent)" : "rgba(0,0,0,0.45)",
                              border: `2px solid ${sel ? "var(--accent)" : "rgba(255,255,255,0.6)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0,
                              transition: "all 0.15s",
                            }}>
                              {sel ? "✓" : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedFotos.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                      {selectedFotos.length} foto{selectedFotos.length !== 1 ? "s" : ""} selecionada{selectedFotos.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "9px 20px",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Agora não
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    background: loading ? "rgba(37,99,235,0.5)" : "var(--accent, #2563eb)",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 22px",
                    fontSize: 13,
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    transition: "background 0.15s",
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Gerando…
                    </>
                  ) : (
                    <> 📄 Emitir Relatório PDF </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Estado de sucesso */
            <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                Relatório emitido com sucesso!
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                O arquivo PDF foi baixado para o seu dispositivo.
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 24px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes closureIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}