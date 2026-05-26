package com.pird.pirdBackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.EventoGetDTO;
import com.pird.pirdBackend.dto.EventoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.EventoService;

@RestController
@RequestMapping("/eventos")
public class EventoController {

    @Autowired
    private EventoService eventoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<EventoGetDTO>> listar() {
        return ResponseEntity.ok(eventoService.listar());
    }

    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('ESPECIALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<List<EventoGetDTO>> listarAtivos() {
        return ResponseEntity.ok(eventoService.listarAtivos());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EventoGetDTO> criar(@RequestBody EventoPostDTO dto,
                                               @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoService.criar(dto, admin));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EventoGetDTO> atualizar(@PathVariable Integer id,
                                                   @RequestBody EventoPostDTO dto) {
        return ResponseEntity.ok(eventoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        eventoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
