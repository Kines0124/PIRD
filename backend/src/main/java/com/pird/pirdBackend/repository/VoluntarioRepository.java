package com.pird.pirdBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pird.pirdBackend.model.Voluntario;

@Repository
public interface VoluntarioRepository extends JpaRepository <Voluntario, Integer>{
    Voluntario findByEmail(String email);
    boolean existsByEmail(String email);

}
