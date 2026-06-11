package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Demanda;

import java.util.List;

public class DemandaGetDTO {

    private Integer id;
    private Integer pontoColetaId;
    private String categoria;
    private String descricaoItem;
    private int quantidadeRecebida;
    private int quantidadeDemanda;
    private Integer prioridade;

    public DemandaGetDTO() {}

    public DemandaGetDTO(Demanda d) {
        this.id                  = d.getId();
        this.pontoColetaId       = d.getPontoColeta() != null ? d.getPontoColeta().getId() : null;
        this.categoria           = d.getCategoria();
        this.descricaoItem       = d.getDescricaoItem();
        this.quantidadeRecebida  = d.getQuantidadeRecebida();
        this.quantidadeDemanda   = d.getQuantidadeDemanda();
        this.prioridade          = d.getPrioridade();
    }

    public static List<DemandaGetDTO> convert(List<Demanda> list) {
        return list.stream().map(DemandaGetDTO::new).toList();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPontoColetaId() { return pontoColetaId; }
    public void setPontoColetaId(Integer pontoColetaId) { this.pontoColetaId = pontoColetaId; }

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
