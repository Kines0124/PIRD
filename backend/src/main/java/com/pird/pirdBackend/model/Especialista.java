package com.pird.pirdBackend.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.locationtech.jts.geom.Point;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

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

@Entity
@Table(name = "especialista")
public class Especialista implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "registro_id",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_especialista_registro")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private RegistroEspecialista registro;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String senhaHash;

    @Column(nullable = false, length = 100)
    private String profissao;

    @Column(length = 14)
    private String cpf;

    @Column(length = 20)
    private String telefone;

    @Column(name = "numero_registro", length = 30)
    private String numeroRegistro;

    @Column(length = 2)
    private String uf;

    // Endereço para autocomplete e roteamento
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

    // Localização geográfica (atualizada a partir do endereço)
    @Column(columnDefinition = "geography(Point, 4326)")
    private Point localizacao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    public Especialista() {}

    @Override
    public String getUsername() { return email; }

    @Override
    public String getPassword() { return senhaHash; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_ESPECIALISTA"));
    }

    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }

    public Integer getId()                    { return id; }
    public void setId(Integer id)             { this.id = id; }

    public RegistroEspecialista getRegistro()                   { return registro; }
    public void setRegistro(RegistroEspecialista registro)      { this.registro = registro; }

    public String getNome()                   { return nome; }
    public void setNome(String nome)          { this.nome = nome; }

    public String getEmail()                  { return email; }
    public void setEmail(String email)        { this.email = email; }

    public String getSenhaHash()              { return senhaHash; }
    public void setSenhaHash(String senhaHash){ this.senhaHash = senhaHash; }

    public String getProfissao()              { return profissao; }
    public void setProfissao(String profissao){ this.profissao = profissao; }

    public String getCpf()                    { return cpf; }
    public void setCpf(String cpf)            { this.cpf = cpf; }

    public String getTelefone()               { return telefone; }
    public void setTelefone(String telefone)  { this.telefone = telefone; }

    public String getNumeroRegistro()                     { return numeroRegistro; }
    public void setNumeroRegistro(String numeroRegistro)  { this.numeroRegistro = numeroRegistro; }

    public String getUf()                     { return uf; }
    public void setUf(String uf)              { this.uf = uf; }

    public String getRua()                    { return rua; }
    public void setRua(String rua)            { this.rua = rua; }

    public String getNumero()                 { return numero; }
    public void setNumero(String numero)      { this.numero = numero; }

    public String getBairro()                 { return bairro; }
    public void setBairro(String bairro)      { this.bairro = bairro; }

    public String getCidade()                 { return cidade; }
    public void setCidade(String cidade)      { this.cidade = cidade; }

    public String getCep()                    { return cep; }
    public void setCep(String cep)            { this.cep = cep; }

    public Point getLocalizacao()             { return localizacao; }
    public void setLocalizacao(Point loc)     { this.localizacao = loc; }

    public LocalDateTime getCriadoEm()        { return criadoEm; }
    public void setCriadoEm(LocalDateTime dt) { this.criadoEm = dt; }
}
