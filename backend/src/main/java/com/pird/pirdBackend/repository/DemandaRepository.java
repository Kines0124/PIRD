package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.Demanda;

import java.util.List;

public interface DemandaRepository extends JpaRepository<Demanda, Integer> {
    List<Demanda> findByPontoColetaId(Integer pontoColetaId);
}
