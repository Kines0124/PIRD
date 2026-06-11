package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DoacaoPostDTO {

    @NotNull(message = "ID da demanda é obrigatório")
    private Integer demandaId;

    private String descricaoItem;

    @NotBlank(message = "Nome do doador é obrigatório")
    private String nomeDoador;

    @NotBlank(message = "Contato do doador é obrigatório")
    private String contatoDoador;

    @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
    private int quantidade;

    public DoacaoPostDTO() {}

    public Integer getDemandaId() { return demandaId; }
    public void setDemandaId(Integer demandaId) { this.demandaId = demandaId; }

    public String getDescricaoItem() { return descricaoItem; }
    public void setDescricaoItem(String descricaoItem) { this.descricaoItem = descricaoItem; }

    public String getNomeDoador() { return nomeDoador; }
    public void setNomeDoador(String nomeDoador) { this.nomeDoador = nomeDoador; }

    public String getContatoDoador() { return contatoDoador; }
    public void setContatoDoador(String contatoDoador) { this.contatoDoador = contatoDoador; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
}
