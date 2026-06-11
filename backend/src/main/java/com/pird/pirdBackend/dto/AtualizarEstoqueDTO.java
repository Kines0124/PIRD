package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.Min;

public class AtualizarEstoqueDTO {

    @Min(value = 0, message = "Quantidade não pode ser negativa")
    private int quantidadeRecebida;

    public AtualizarEstoqueDTO() {}

    public int getQuantidadeRecebida() { return quantidadeRecebida; }
    public void setQuantidadeRecebida(int quantidadeRecebida) { this.quantidadeRecebida = quantidadeRecebida; }
}
