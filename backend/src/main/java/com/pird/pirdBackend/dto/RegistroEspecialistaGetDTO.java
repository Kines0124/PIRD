package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.RegistroEspecialista;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class RegistroEspecialistaGetDTO {

    private Integer id;
    private String  nome;
    private String  cpf;
    private String  telefone;
    private String  profissao;
    private String  numeroRegistro;
    private String  uf;
    private String  status;
    private String  observacao;
    private String  criadoEm;
    private String  revisadoEm;
    private Integer especialistaId;

    public RegistroEspecialistaGetDTO() {}

    public RegistroEspecialistaGetDTO(RegistroEspecialista r) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        this.id              = r.getId();
        this.nome            = r.getNome();
        this.cpf             = r.getCpf();
        this.telefone        = r.getTelefone();
        this.profissao       = r.getProfissao();
        this.numeroRegistro  = r.getNumeroRegistro();
        this.uf              = r.getUf();
        this.status          = r.getStatus();
        this.observacao      = r.getObservacao();
        this.criadoEm        = r.getCriadoEm() != null ? r.getCriadoEm().format(fmt) : null;
        this.revisadoEm      = r.getRevisadoEm() != null ? r.getRevisadoEm().format(fmt) : null;
    }

    public static List<RegistroEspecialistaGetDTO> convert(List<RegistroEspecialista> list) {
        return list.stream().map(RegistroEspecialistaGetDTO::new).toList();
    }

    public Integer getId()              { return id; }
    public String  getNome()            { return nome; }
    public String  getCpf()             { return cpf; }
    public String  getTelefone()        { return telefone; }
    public String  getProfissao()       { return profissao; }
    public String  getNumeroRegistro()  { return numeroRegistro; }
    public String  getUf()              { return uf; }
    public String  getStatus()          { return status; }
    public String  getObservacao()      { return observacao; }
    public String  getCriadoEm()        { return criadoEm; }
    public String  getRevisadoEm()      { return revisadoEm; }
    public Integer getEspecialistaId()  { return especialistaId; }
    public void    setEspecialistaId(Integer especialistaId) { this.especialistaId = especialistaId; }
}
