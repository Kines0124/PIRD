package com.pird.pirdBackend.dto;

public class PontoColetaPutDTO {

    private String nomeLocal;
    private Boolean tipoPonto;
    private String email;
    private String senhaAtual;
    private String novaSenha;

    public PontoColetaPutDTO() {}

    public String getNomeLocal() { return nomeLocal; }
    public void setNomeLocal(String nomeLocal) { this.nomeLocal = nomeLocal; }

    public Boolean getTipoPonto() { return tipoPonto; }
    public void setTipoPonto(Boolean tipoPonto) { this.tipoPonto = tipoPonto; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenhaAtual() { return senhaAtual; }
    public void setSenhaAtual(String senhaAtual) { this.senhaAtual = senhaAtual; }

    public String getNovaSenha() { return novaSenha; }
    public void setNovaSenha(String novaSenha) { this.novaSenha = novaSenha; }
}
