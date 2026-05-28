package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class DemandaPostDTO {

    @NotBlank(message = "Categoria é obrigatória")
    private String categoria;

    @NotBlank(message = "Descrição do item é obrigatória")
    private String descricaoItem;

    @Min(value = 1, message = "Quantidade demandada deve ser no mínimo 1")
    private int quantidadeDemanda;

    private Integer prioridade;

    public DemandaPostDTO() {}

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescricaoItem() { return descricaoItem; }
    public void setDescricaoItem(String descricaoItem) { this.descricaoItem = descricaoItem; }

    public int getQuantidadeDemanda() { return quantidadeDemanda; }
    public void setQuantidadeDemanda(int quantidadeDemanda) { this.quantidadeDemanda = quantidadeDemanda; }

    public Integer getPrioridade() { return prioridade; }
    public void setPrioridade(Integer prioridade) { this.prioridade = prioridade; }
}
