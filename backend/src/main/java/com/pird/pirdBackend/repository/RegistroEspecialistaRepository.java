package com.pird.pirdBackend.repository;

import com.pird.pirdBackend.model.RegistroEspecialista;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistroEspecialistaRepository extends JpaRepository<RegistroEspecialista, Integer> {
    List<RegistroEspecialista> findAllByOrderByCriadoEmDesc();
    List<RegistroEspecialista> findByStatusOrderByCriadoEmDesc(String status);
}
