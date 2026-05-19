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

import com.pird.pirdBackend.dto.PontoCriticoGetDTO;
import com.pird.pirdBackend.dto.PontoCriticoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.PontoCriticoService;

@RestController
@RequestMapping("/pontos-criticos")
public class PontoCriticoController {

    @Autowired
    private PontoCriticoService pontoCriticoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PontoCriticoGetDTO>> listar() {
        return ResponseEntity.ok(pontoCriticoService.listar());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PontoCriticoGetDTO> criar(@RequestBody PontoCriticoPostDTO dto,
                                                     @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pontoCriticoService.criar(dto, admin));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PontoCriticoGetDTO> atualizar(@PathVariable Integer id,
                                                         @RequestBody PontoCriticoPostDTO dto) {
        return ResponseEntity.ok(pontoCriticoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        pontoCriticoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
