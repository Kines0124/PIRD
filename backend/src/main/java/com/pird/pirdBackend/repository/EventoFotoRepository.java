package com.pird.pirdBackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pird.pirdBackend.model.EventoFoto;

public interface EventoFotoRepository extends JpaRepository<EventoFoto, Integer> {
    List<EventoFoto> findByEventoIdOrderByUploadedAtAsc(Integer eventoId);
}
