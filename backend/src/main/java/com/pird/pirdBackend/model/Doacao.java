package com.pird.pirdBackend.model;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "doacao")
public class Doacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "demanda_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_doacao_demanda")
    )
    private Demanda demanda;

    @Column(name = "nome_doador", nullable = false, length = 100)
    private String nomeDoador;

    @Column(name = "contato_doador", nullable = false, length = 100)
    private String contatoDoador;

    @Column(name = "descricao_item", length = 255)
    private String descricaoItem;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false, length = 20)
    private String status = "pendente";

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    public Doacao() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Demanda getDemanda() { return demanda; }
    public void setDemanda(Demanda demanda) { this.demanda = demanda; }

    public String getNomeDoador() { return nomeDoador; }
    public void setNomeDoador(String nomeDoador) { this.nomeDoador = nomeDoador; }

    public String getContatoDoador() { return contatoDoador; }
    public void setContatoDoador(String contatoDoador) { this.contatoDoador = contatoDoador; }

    public String getDescricaoItem() { return descricaoItem; }
    public void setDescricaoItem(String descricaoItem) { this.descricaoItem = descricaoItem; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
