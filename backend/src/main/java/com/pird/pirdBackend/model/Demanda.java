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

@Entity
@Table(name = "demanda")
public class Demanda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "ponto_coleta_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_demanda_ponto_coleta")
    )
    private PontoColeta pontoColeta;

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(name = "descricao_item", nullable = false, length = 255)
    private String descricaoItem;

    @Column(name = "quantidade_recebida", nullable = false)
    private int quantidadeRecebida = 0;

    @Column(name = "quantidade_demanda", nullable = false)
    private int quantidadeDemanda;

    private Integer prioridade;

    public Demanda() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public PontoColeta getPontoColeta() { return pontoColeta; }
    public void setPontoColeta(PontoColeta pontoColeta) { this.pontoColeta = pontoColeta; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescricaoItem() { return descricaoItem; }
    public void setDescricaoItem(String descricaoItem) { this.descricaoItem = descricaoItem; }

    public int getQuantidadeRecebida() { return quantidadeRecebida; }
    public void setQuantidadeRecebida(int quantidadeRecebida) { this.quantidadeRecebida = quantidadeRecebida; }

    public int getQuantidadeDemanda() { return quantidadeDemanda; }
    public void setQuantidadeDemanda(int quantidadeDemanda) { this.quantidadeDemanda = quantidadeDemanda; }

    public Integer getPrioridade() { return prioridade; }
    public void setPrioridade(Integer prioridade) { this.prioridade = prioridade; }
}
