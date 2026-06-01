package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Convocacao;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.model.PontoColeta;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;


public class EventoRelatorioDTO {

    private Integer id;
    private String  protocolo;
    private String  titulo;
    private String  tipo;
    private String  severidade;
    private String  status;
    private String  cidade;
    private String  endereco;
    private double  lat;
    private double  lng;
    private String  dataInicio;
    private String  dataFim;
    private String  duracao;
    private int     vitimasEstimadas;
    private String  descricao;

    private List<EspecialistaResumoDTO> especialistas;
    private List<PontoColetaResumoDTO>  pontosColeta;

    // ── construtores ────────────────────────────────────────────────────────

    public EventoRelatorioDTO() {}

    public EventoRelatorioDTO(
            Evento evento,
            List<Convocacao> convocacoes,
            List<PontoColeta> pontosColeta
    ) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        this.id         = evento.getId();
        this.protocolo  = String.format("DC-%d-%d", evento.getId(), LocalDateTime.now().getYear());
        this.titulo     = evento.getTitulo();
        this.tipo       = evento.getTipo();
        this.severidade = evento.getSeveridade();
        this.status     = evento.getStatus();
        this.cidade     = evento.getCidade();
        this.endereco   = evento.getEndereco();
        this.lat        = evento.getLocalizacao() != null ? evento.getLocalizacao().getY() : 0;
        this.lng        = evento.getLocalizacao() != null ? evento.getLocalizacao().getX() : 0;
        this.descricao  = evento.getDescricao();
        this.vitimasEstimadas = evento.getVitimasEstimadas();

        this.dataInicio = evento.getDataInicio() != null
                ? evento.getDataInicio().format(fmt)
                : null;

        this.dataFim = evento.getDataFim() != null
                ? evento.getDataFim().format(fmt)
                : null;

        this.duracao = calcularDuracao(evento.getDataInicio(), evento.getDataFim());

        // Especialistas que atuaram (convocações não-recusadas)
        this.especialistas = (convocacoes == null ? List.<Convocacao>of() : convocacoes)
                .stream()
                .filter(c -> !"recusado".equalsIgnoreCase(c.getStatus()))
                .map(c -> new EspecialistaResumoDTO(
                        c.getEspecialista().getNome(),
                        c.getEspecialista().getProfissao(),
                        c.getEspecialista().getUf(),
                        c.getStatus()
                ))
                .toList();

        // Pontos de coleta vinculados no momento do relatório.
        // PontoColeta não possui campo cidade separado: o endereço é armazenado
        // no formato "Rua X, nº Y, NomeDaCidade" (sufixo após a última vírgula).
        this.pontosColeta = (pontosColeta == null ? List.<PontoColeta>of() : pontosColeta)
                .stream()
                .map(p -> {
                    String end    = p.getEndereco();
                    String cidade = null;
                    if (end != null) {
                        int idx = end.lastIndexOf(',');
                        cidade = idx >= 0 ? end.substring(idx + 1).trim() : null;
                    }
                    return new PontoColetaResumoDTO(p.getNomeLocal(), end, cidade);
                })
                .toList();
    }

    // ── utilitário ──────────────────────────────────────────────────────────

    private static String calcularDuracao(LocalDateTime inicio, LocalDateTime fim) {
        if (inicio == null || fim == null) return null;
        long horas   = ChronoUnit.HOURS.between(inicio, fim);
        long minutos = ChronoUnit.MINUTES.between(inicio, fim) % 60;
        if (horas > 0) return horas + "h " + minutos + "min";
        return minutos + " minutos";
    }

    // ── sub-DTOs ────────────────────────────────────────────────────────────

    public static class EspecialistaResumoDTO {
        private String nome;
        private String profissao;
        private String uf;
        private String statusConvocacao;

        public EspecialistaResumoDTO() {}

        public EspecialistaResumoDTO(String nome, String profissao, String uf, String statusConvocacao) {
            this.nome              = nome;
            this.profissao         = profissao;
            this.uf                = uf;
            this.statusConvocacao  = statusConvocacao;
        }

        public String getNome()             { return nome; }
        public String getProfissao()        { return profissao; }
        public String getUf()               { return uf; }
        public String getStatusConvocacao() { return statusConvocacao; }
    }

    public static class PontoColetaResumoDTO {
        private String nome;
        private String endereco;
        private String cidade;

        public PontoColetaResumoDTO() {}

        public PontoColetaResumoDTO(String nome, String endereco, String cidade) {
            this.nome     = nome;
            this.endereco = endereco;
            this.cidade   = cidade;
        }

        public String getNome()     { return nome; }
        public String getEndereco() { return endereco; }
        public String getCidade()   { return cidade; }
    }

    // ── getters do DTO raiz ─────────────────────────────────────────────────

    public Integer getId()                            { return id; }
    public String  getProtocolo()                     { return protocolo; }
    public String  getTitulo()                        { return titulo; }
    public String  getTipo()                          { return tipo; }
    public String  getSeveridade()                    { return severidade; }
    public String  getStatus()                        { return status; }
    public String  getCidade()                        { return cidade; }
    public String  getEndereco()                      { return endereco; }
    public double  getLat()                           { return lat; }
    public double  getLng()                           { return lng; }
    public String  getDataInicio()                    { return dataInicio; }
    public String  getDataFim()                       { return dataFim; }
    public String  getDuracao()                       { return duracao; }
    public int     getVitimasEstimadas()              { return vitimasEstimadas; }
    public String  getDescricao()                     { return descricao; }
    public List<EspecialistaResumoDTO> getEspecialistas() { return especialistas; }
    public List<PontoColetaResumoDTO>  getPontosColeta()  { return pontosColeta; }
}