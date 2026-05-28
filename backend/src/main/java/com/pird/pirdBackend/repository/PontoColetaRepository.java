package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.PontoColeta;

public interface PontoColetaRepository extends JpaRepository<PontoColeta, Integer> {
    PontoColeta findByEmail(String email);
    boolean existsByEmail(String email);
    PontoColeta findByCnpj(String cnpj);
    boolean existsByCnpj(String cnpj);
    java.util.List<PontoColeta> findAllByValidadoTrue();
}
