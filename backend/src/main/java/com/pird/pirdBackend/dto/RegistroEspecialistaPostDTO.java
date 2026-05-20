package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.RegistroEspecialista;

public class RegistroEspecialistaPostDTO {

    private String nome;
    private String cpf;
    private String telefone;
    private String profissao;
    private String numeroRegistro;
    private String uf;

    public RegistroEspecialistaPostDTO() {}

    public RegistroEspecialista convert() {
        RegistroEspecialista r = new RegistroEspecialista();
        r.setNome(nome);
        r.setCpf(cpf);
        r.setTelefone(telefone);
        r.setProfissao(profissao);
        r.setNumeroRegistro(numeroRegistro);
        r.setUf(uf);
        return r;
    }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getProfissao() { return profissao; }
    public void setProfissao(String profissao) { this.profissao = profissao; }

    public String getNumeroRegistro() { return numeroRegistro; }
    public void setNumeroRegistro(String numeroRegistro) { this.numeroRegistro = numeroRegistro; }

    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
}
