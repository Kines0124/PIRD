package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.Doacao;

import java.util.List;

public interface DoacaoRepository extends JpaRepository<Doacao, Integer> {
    List<Doacao> findByDemandaId(Integer demandaId);
    List<Doacao> findByDemandaPontoColetaId(Integer pontoColetaId);
}
