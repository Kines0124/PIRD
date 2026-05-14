package com.pird.pirdBackend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "voluntario")
@Getter
@Setter
public class Voluntario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nome;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String senhaHash;

    @Column(nullable = false, length = 100)
    private String especialidade;

    @Column(columnDefinition = "geography(Point, 4326)", nullable = false)
    private Point localizacao;

    @Column(nullable = false)
    private boolean validado = false;

    @Column(name = "validado_em")
    private LocalDateTime validadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "validado_por",
        referencedColumnName = "id",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_voluntario_admin")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Administrador validadoPor;

}
