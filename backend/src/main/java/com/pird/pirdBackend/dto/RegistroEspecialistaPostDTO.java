package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.RegistroEspecialista;

public class RegistroEspecialistaPostDTO {

    private String nome;
    private String cpf;
    private String telefone;
    private String profissao;
    private String numeroRegistro;
    private String uf;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String cep;
    private String email;

    public RegistroEspecialistaPostDTO() {}

    public RegistroEspecialista convert() {
        RegistroEspecialista r = new RegistroEspecialista();
        r.setNome(nome);
        r.setCpf(cpf);
        r.setTelefone(telefone);
        r.setProfissao(profissao);
        r.setNumeroRegistro(numeroRegistro);
        r.setUf(uf);
        r.setRua(rua);
        r.setNumero(numero);
        r.setBairro(bairro);
        r.setCidade(cidade);
        r.setCep(cep);
        r.setEmail(email);
        return r;
    }

    public String getNome()            { return nome; }
    public void setNome(String nome)   { this.nome = nome; }

    public String getCpf()             { return cpf; }
    public void setCpf(String cpf)     { this.cpf = cpf; }

    public String getTelefone()        { return telefone; }
    public void setTelefone(String t)  { this.telefone = t; }

    public String getProfissao()       { return profissao; }
    public void setProfissao(String p) { this.profissao = p; }

    public String getNumeroRegistro()          { return numeroRegistro; }
    public void setNumeroRegistro(String nr)   { this.numeroRegistro = nr; }

    public String getUf()              { return uf; }
    public void setUf(String uf)       { this.uf = uf; }

    public String getRua()             { return rua; }
    public void setRua(String rua)     { this.rua = rua; }

    public String getNumero()              { return numero; }
    public void setNumero(String numero)   { this.numero = numero; }

    public String getBairro()              { return bairro; }
    public void setBairro(String bairro)   { this.bairro = bairro; }

    public String getCidade()              { return cidade; }
    public void setCidade(String cidade)   { this.cidade = cidade; }

    public String getCep()             { return cep; }
    public void setCep(String cep)     { this.cep = cep; }

    public String getEmail()           { return email; }
    public void setEmail(String email) { this.email = email; }
}
