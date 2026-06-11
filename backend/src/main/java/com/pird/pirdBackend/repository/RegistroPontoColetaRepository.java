package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.RegistroPontoColeta;

public interface RegistroPontoColetaRepository extends JpaRepository<RegistroPontoColeta, Integer> {
    boolean existsByCnpj(String cnpj);
    RegistroPontoColeta findByCnpj(String cnpj);
}
