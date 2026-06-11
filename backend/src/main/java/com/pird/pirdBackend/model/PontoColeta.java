package com.pird.pirdBackend.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.locationtech.jts.geom.Point;

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
import lombok.Getter;
import lombok.Setter;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Table(name = "ponto_coleta")
@Getter
@Setter
public class PontoColeta implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome_local", nullable = false, length = 150)
    private String nomeLocal;

    @Column(nullable = false, length = 255)
    private String endereco;

    @Column(columnDefinition = "geography(Point, 4326)", nullable = false)
    private Point localizacao;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false, unique = true, length = 18)
    private String cnpj;

    @Column(unique = true, length = 100)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(name = "tipo_ponto", nullable = false)
    private boolean tipoPonto = true;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private boolean validado = false;

    @Column(name = "validado_em")
    private LocalDateTime validadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "validado_por",
        referencedColumnName = "id",
        nullable = true,
        foreignKey = @ForeignKey(name = "fk_ponto_coleta_admin")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Administrador validadoPor;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Override
    public String getUsername() {
        return this.cnpj;
    }

    @Override
    public String getPassword() {
        return this.senhaHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_PONTO_COLETA"));
    }

    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return ativo; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return ativo && validado; }
}
