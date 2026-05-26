package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.EspecialistaGetDTO;
import com.pird.pirdBackend.dto.EspecialistaPutDTO;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.service.EspecialistaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para especialistas aprovados (entidade Especialista).
 *
 * Base: /especialistas/aprovados
 *
 * GET  /especialistas/aprovados          → admin — lista todos
 * GET  /especialistas/aprovados/perfil   → especialista — próprio perfil
 * GET  /especialistas/aprovados/{id}     → admin — perfil por ID
 * PUT  /especialistas/aprovados/{id}     → especialista — atualiza endereço / localização
 * DELETE /especialistas/aprovados/{id}   → admin — remove
 */
@RestController
@RequestMapping("/especialistas/aprovados")
public class EspecialistaController {

    @Autowired
    private EspecialistaService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<EspecialistaGetDTO>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/perfil")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<EspecialistaGetDTO> perfil(@AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.buscarPorId(especialista.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EspecialistaGetDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<EspecialistaGetDTO> atualizar(
            @PathVariable Integer id,
            @RequestBody EspecialistaPutDTO dto,
            @AuthenticationPrincipal Especialista especialista) {

        if (!especialista.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Integer id) {
        service.deletar(id);
    }
}
