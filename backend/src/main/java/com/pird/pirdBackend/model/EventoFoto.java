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
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evento_foto")
@Getter
@Setter
public class EventoFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "evento_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_evento_foto_evento")
    )
    private Evento evento;

    @Column(name = "foto_url", nullable = false, columnDefinition = "TEXT")
    private String fotoUrl;

    @Column(name = "nome_arquivo", length = 255)
    private String nomeArquivo;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
