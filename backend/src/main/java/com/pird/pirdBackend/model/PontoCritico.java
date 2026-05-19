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
@Table(name = "ponto_critico")
@Getter
@Setter
public class PontoCritico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome_local", nullable = false, length = 150)
    private String nomeLocal;

    @Column(name = "tipo_risco", nullable = false, length = 30)
    private String tipoRisco;

    @Column(name = "nivel_risco", nullable = false, length = 20)
    private String nivelRisco;

    @Column(columnDefinition = "geography(Point, 4326)", nullable = false)
    private Point localizacao;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "criado_por",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_ponto_critico_admin")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Administrador criadoPor;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();
}
