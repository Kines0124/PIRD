package com.pird.pirdBackend.model;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "administrador")
@Getter
@Setter 
public class Administrador implements UserDetails{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "senha_hash",nullable = false)
    private String senhaHash;


        @Override
    public String getUsername(){
        return this.email;
    }

        @Override
    public String getPassword(){
        return this.senhaHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
    }

    @Override public boolean isAccountNonExpired() { return true;}
    @Override public boolean isAccountNonLocked() { return true;}
    @Override public boolean isCredentialsNonExpired() { return true;}
    @Override public boolean isEnabled() { return true;}

}
