package com.pird.pirdBackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.Evento;

public interface EventoRepository extends JpaRepository<Evento, Integer> {
    boolean existsByStatusIn(List<String> statuses);
    List<Evento> findByStatus(String status);
    boolean existsByTipoAndEnderecoIgnoreCaseAndStatus(String tipo, String endereco, String status);
}
