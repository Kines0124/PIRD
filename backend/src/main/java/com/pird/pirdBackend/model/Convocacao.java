package com.pird.pirdBackend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "convocacao",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_convocacao_evento_especialista",
        columnNames = {"evento_id", "especialista_id"}
    )
)
public class Convocacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "evento_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_convocacao_evento")
    )
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "especialista_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_convocacao_especialista")
    )
    private Especialista especialista;

    // pendente | a_caminho | no_local | recusada
    @Column(nullable = false, length = 20)
    private String status = "pendente";

    // auto | manual
    @Column(nullable = false, length = 10)
    private String tipo = "auto";

    @Column(name = "convocado_em", nullable = false, updatable = false)
    private LocalDateTime convocadoEm = LocalDateTime.now();

    @Column(name = "respondido_em")
    private LocalDateTime respondidoEm;

    @Column(name = "chegada_em")
    private LocalDateTime chegadaEm;

    public Convocacao() {}

    public Integer getId()                          { return id; }
    public void setId(Integer id)                   { this.id = id; }

    public Evento getEvento()                       { return evento; }
    public void setEvento(Evento evento)            { this.evento = evento; }

    public Especialista getEspecialista()           { return especialista; }
    public void setEspecialista(Especialista e)     { this.especialista = e; }

    public String getStatus()                       { return status; }
    public void setStatus(String status)            { this.status = status; }

    public String getTipo()                         { return tipo; }
    public void setTipo(String tipo)                { this.tipo = tipo; }

    public LocalDateTime getConvocadoEm()           { return convocadoEm; }
    public void setConvocadoEm(LocalDateTime dt)    { this.convocadoEm = dt; }

    public LocalDateTime getRespondidoEm()          { return respondidoEm; }
    public void setRespondidoEm(LocalDateTime dt)   { this.respondidoEm = dt; }

    public LocalDateTime getChegadaEm()            { return chegadaEm; }
    public void setChegadaEm(LocalDateTime dt)     { this.chegadaEm = dt; }
}
