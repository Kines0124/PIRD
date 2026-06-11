package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Especialista;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class EspecialistaGetDTO {

    private Integer id;
    private String  nome;
    private String  email;
    private String  profissao;
    private String  cpf;
    private String  telefone;
    private String  numeroRegistro;
    private String  uf;
    private String  rua;
    private String  numero;
    private String  bairro;
    private String  cidade;
    private String  cep;
    private Double  latitude;
    private Double  longitude;
    private String  criadoEm;
    private Integer registroId;
    private String  status;
    private Integer especialistaId;

    public EspecialistaGetDTO() {}

    public EspecialistaGetDTO(Especialista e) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        this.id             = e.getId();
        this.nome           = e.getNome();
        this.email          = e.getEmail();
        this.profissao      = e.getProfissao();
        this.cpf            = e.getCpf();
        this.telefone       = e.getTelefone();
        this.numeroRegistro = e.getNumeroRegistro();
        this.uf             = e.getUf();
        this.rua            = e.getRua();
        this.numero         = e.getNumero();
        this.bairro         = e.getBairro();
        this.cidade         = e.getCidade();
        this.cep            = e.getCep();
        this.criadoEm       = e.getCriadoEm() != null ? e.getCriadoEm().format(fmt) : null;
        this.registroId     = e.getRegistro() != null ? e.getRegistro().getId() : null;
        this.status         = "aprovado";
        this.especialistaId = e.getId();

        if (e.getLocalizacao() != null) {
            this.latitude  = e.getLocalizacao().getY();
            this.longitude = e.getLocalizacao().getX();
        }
    }

    public static List<EspecialistaGetDTO> convert(List<Especialista> list) {
        return list.stream().map(EspecialistaGetDTO::new).toList();
    }

    public Integer getId()             { return id; }
    public String  getNome()           { return nome; }
    public String  getEmail()          { return email; }
    public String  getProfissao()      { return profissao; }
    public String  getCpf()            { return cpf; }
    public String  getTelefone()       { return telefone; }
    public String  getNumeroRegistro() { return numeroRegistro; }
    public String  getUf()             { return uf; }
    public String  getRua()            { return rua; }
    public String  getNumero()         { return numero; }
    public String  getBairro()         { return bairro; }
    public String  getCidade()         { return cidade; }
    public String  getCep()            { return cep; }
    public Double  getLatitude()       { return latitude; }
    public Double  getLongitude()      { return longitude; }
    public String  getCriadoEm()       { return criadoEm; }
    public Integer getRegistroId()     { return registroId; }
    public String  getStatus()         { return status; }
    public Integer getEspecialistaId() { return especialistaId; }
}
