package com.pird.pirdBackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.PontoColetaGetDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.PontoColetaService;

@RestController
@RequestMapping("/pontos-coleta")
public class PontoColetaController {

    @Autowired
    private PontoColetaService pontoColetaService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PontoColetaGetDTO>> listar() {
        return ResponseEntity.ok(pontoColetaService.listar());
    }

    @PatchMapping("/{id}/validar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PontoColetaGetDTO> validar(@PathVariable Integer id,
                                                      @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.ok(pontoColetaService.validar(id, admin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        pontoColetaService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
