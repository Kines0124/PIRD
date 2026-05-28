package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.Min;

public class AtualizarLimiteDTO {

    @Min(value = 1, message = "Limite deve ser no mínimo 1")
    private int quantidadeDemanda;

    public AtualizarLimiteDTO() {}

    public int getQuantidadeDemanda() { return quantidadeDemanda; }
    public void setQuantidadeDemanda(int quantidadeDemanda) { this.quantidadeDemanda = quantidadeDemanda; }
}
