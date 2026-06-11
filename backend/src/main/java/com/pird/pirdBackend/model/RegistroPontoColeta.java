package com.pird.pirdBackend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "registro_ponto_coleta")
public class RegistroPontoColeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome_local", nullable = false, length = 150)
    private String nomeLocal;

    @Column(nullable = false, length = 18)
    private String cnpj;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String rua;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 10)
    private String cep;

    @Column(name = "tipo_ponto", nullable = false)
    private boolean tipoPonto = true;

    @Column(nullable = false, length = 20)
    private String status = "pendente";

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(name = "revisado_em")
    private LocalDateTime revisadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "revisado_por",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_reg_pc_admin")
    )
    private Administrador revisadoPor;

    public RegistroPontoColeta() {}

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

    public Administrador getRevisadoPor() { return revisadoPor; }
    public void setRevisadoPor(Administrador revisadoPor) { this.revisadoPor = revisadoPor; }
}
