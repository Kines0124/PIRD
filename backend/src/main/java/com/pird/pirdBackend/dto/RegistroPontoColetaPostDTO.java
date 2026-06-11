package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.NotBlank;

public class RegistroPontoColetaPostDTO {

    @NotBlank(message = "Nome do ponto é obrigatório")
    private String nomeLocal;

    @NotBlank(message = "CNPJ é obrigatório")
    private String cnpj;

    @NotBlank(message = "Telefone é obrigatório")
    private String telefone;

    private String email;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String cep;
    private boolean tipoPonto = true;

    public RegistroPontoColetaPostDTO() {}

    public String getNomeLocal() { return nomeLocal; }
    public void setNomeLocal(String nomeLocal) { this.nomeLocal = nomeLocal; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRua() { return rua; }
    public void setRua(String rua) { this.rua = rua; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public boolean isTipoPonto() { return tipoPonto; }
    public void setTipoPonto(boolean tipoPonto) { this.tipoPonto = tipoPonto; }
}
