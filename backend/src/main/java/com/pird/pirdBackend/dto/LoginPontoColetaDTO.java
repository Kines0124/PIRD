package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginPontoColetaDTO {

    @NotBlank(message = "CNPJ é obrigatório")
    private String cnpj;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;

    public LoginPontoColetaDTO() {}

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}
