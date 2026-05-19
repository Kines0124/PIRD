package com.pird.pirdBackend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.locationtech.jts.geom.Point;

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
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evento")
@Getter
@Setter
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "criado_por",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_evento_admin")
    )
    private Administrador criadoPor;

    @Column(nullable = false, length = 200, unique = true)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "geography(Point, 4326)", nullable = false)
    private Point localizacao;

    @Column(length = 100)
    private String cidade;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, length = 20)
    private String status = "ativo";

    @Column(nullable = false, length = 20)
    private String severidade = "medio";

    @Column(name = "vitimas_estimadas", nullable = false)
    private int vitimasEstimadas = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "ponto_critico_id",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_evento_ponto_critico")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private PontoCritico pontoCritico;

    @Column(name = "data_inicio", nullable = false, updatable = false)
    private LocalDateTime dataInicio = LocalDateTime.now();

    @Column(name = "data_fim")
    private LocalDateTime dataFim;
}
