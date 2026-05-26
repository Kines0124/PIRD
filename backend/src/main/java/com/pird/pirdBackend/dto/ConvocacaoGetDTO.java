package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Convocacao;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class ConvocacaoGetDTO {

    private Integer id;
    private Integer eventoId;
    private String  eventoTitulo;
    private String  eventoTipo;
    private String  eventoSeveridade;
    private String  eventoEndereco;
    private Double  eventoLat;
    private Double  eventoLng;
    private Integer especialistaId;
    private String  especialistaNome;
    private String  especialistaProfissao;
    private String  status;
    private String  tipo;
    private String  convocadoEm;
    private String  respondidoEm;

    public ConvocacaoGetDTO() {}

    public ConvocacaoGetDTO(Convocacao c) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        this.id                    = c.getId();
        this.status                = c.getStatus();
        this.tipo                  = c.getTipo();
        this.convocadoEm           = c.getConvocadoEm() != null  ? c.getConvocadoEm().format(fmt)  : null;
        this.respondidoEm          = c.getRespondidoEm() != null ? c.getRespondidoEm().format(fmt) : null;

        if (c.getEvento() != null) {
            this.eventoId         = c.getEvento().getId();
            this.eventoTitulo     = c.getEvento().getTitulo();
            this.eventoTipo       = c.getEvento().getTipo();
            this.eventoSeveridade = c.getEvento().getSeveridade();
            this.eventoEndereco   = c.getEvento().getEndereco() != null
                                     ? c.getEvento().getEndereco()
                                     : c.getEvento().getCidade();
            if (c.getEvento().getLocalizacao() != null) {
                this.eventoLat = c.getEvento().getLocalizacao().getY();
                this.eventoLng = c.getEvento().getLocalizacao().getX();
            }
        }

        if (c.getEspecialista() != null) {
            this.especialistaId       = c.getEspecialista().getId();
            this.especialistaNome     = c.getEspecialista().getNome();
            this.especialistaProfissao = c.getEspecialista().getProfissao();
        }
    }

    public static List<ConvocacaoGetDTO> convert(List<Convocacao> list) {
        return list.stream().map(ConvocacaoGetDTO::new).toList();
    }

    public Integer getId()                    { return id; }
    public Integer getEventoId()              { return eventoId; }
    public String  getEventoTitulo()          { return eventoTitulo; }
    public String  getEventoTipo()            { return eventoTipo; }
    public String  getEventoSeveridade()      { return eventoSeveridade; }
    public String  getEventoEndereco()        { return eventoEndereco; }
    public Double  getEventoLat()             { return eventoLat; }
    public Double  getEventoLng()             { return eventoLng; }
    public Integer getEspecialistaId()        { return especialistaId; }
    public String  getEspecialistaNome()      { return especialistaNome; }
    public String  getEspecialistaProfissao() { return especialistaProfissao; }
    public String  getStatus()                { return status; }
    public String  getTipo()                  { return tipo; }
    public String  getConvocadoEm()           { return convocadoEm; }
    public String  getRespondidoEm()          { return respondidoEm; }
}
