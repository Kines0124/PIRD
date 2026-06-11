package com.pird.pirdBackend.dto;

public class AdminPutDTO {

    private String nome;
    private String senhaAtual;
    private String senha;

    public AdminPutDTO() {}

    public String getNome()       { return nome; }
    public void   setNome(String nome)         { this.nome = nome; }

    public String getSenhaAtual() { return senhaAtual; }
    public void   setSenhaAtual(String senhaAtual) { this.senhaAtual = senhaAtual; }

    public String getSenha()      { return senha; }
    public void   setSenha(String senha)       { this.senha = senha; }
}
