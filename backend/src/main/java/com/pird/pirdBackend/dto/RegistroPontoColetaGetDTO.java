package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.RegistroPontoColeta;

import java.time.LocalDateTime;
import java.util.List;

public class RegistroPontoColetaGetDTO {

    private Integer id;
    private String nomeLocal;
    private String cnpj;
    private String telefone;
    private String email;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String cep;
    private boolean tipoPonto;
    private String status;
    private String observacao;
    private LocalDateTime criadoEm;
    private LocalDateTime revisadoEm;

    public RegistroPontoColetaGetDTO() {}

    public RegistroPontoColetaGetDTO(RegistroPontoColeta r) {
        this.id          = r.getId();
        this.nomeLocal   = r.getNomeLocal();
        this.cnpj        = r.getCnpj();
        this.telefone    = r.getTelefone();
        this.email       = r.getEmail();
        this.rua         = r.getRua();
        this.numero      = r.getNumero();
        this.bairro      = r.getBairro();
        this.cidade      = r.getCidade();
        this.cep         = r.getCep();
        this.tipoPonto   = r.isTipoPonto();
        this.status      = r.getStatus();
        this.observacao  = r.getObservacao();
        this.criadoEm    = r.getCriadoEm();
        this.revisadoEm  = r.getRevisadoEm();
    }

    public static List<RegistroPontoColetaGetDTO> convert(List<RegistroPontoColeta> list) {
        return list.stream().map(RegistroPontoColetaGetDTO::new).toList();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getRevisadoEm() { return revisadoEm; }
    public void setRevisadoEm(LocalDateTime revisadoEm) { this.revisadoEm = revisadoEm; }
}
