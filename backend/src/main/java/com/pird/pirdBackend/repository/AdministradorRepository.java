package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.Administrador;

public interface AdministradorRepository extends JpaRepository <Administrador, Integer> {
    
}
