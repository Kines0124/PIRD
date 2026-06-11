package com.pird.pirdBackend.dto;

import java.time.format.DateTimeFormatter;

import com.pird.pirdBackend.model.EventoFoto;

public class EventoFotoGetDTO {

    private Integer id;
    private Integer eventoId;
    private String fotoUrl;
    private String nomeArquivo;
    private String uploadedAt;

    public EventoFotoGetDTO() {}

    public EventoFotoGetDTO(EventoFoto f) {
        this.id          = f.getId();
        this.eventoId    = f.getEvento().getId();
        this.fotoUrl     = f.getFotoUrl();
        this.nomeArquivo = f.getNomeArquivo();
        this.uploadedAt  = f.getUploadedAt() != null
            ? f.getUploadedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            : null;
    }

    public Integer getId()          { return id; }
    public Integer getEventoId()    { return eventoId; }
    public String getFotoUrl()      { return fotoUrl; }
    public String getNomeArquivo()  { return nomeArquivo; }
    public String getUploadedAt()   { return uploadedAt; }
}
