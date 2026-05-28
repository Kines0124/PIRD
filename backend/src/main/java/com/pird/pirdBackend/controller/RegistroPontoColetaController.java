package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.RegistroPontoColetaGetDTO;
import com.pird.pirdBackend.dto.RegistroPontoColetaPostDTO;
import com.pird.pirdBackend.dto.RejeitarDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.RegistroPontoColetaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/registro-pontos-coleta")
public class RegistroPontoColetaController {

    @Autowired
    private RegistroPontoColetaService service;

    @PostMapping
    public ResponseEntity<RegistroPontoColetaGetDTO> criar(@RequestBody @Valid RegistroPontoColetaPostDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<RegistroPontoColetaGetDTO>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<RegistroPontoColetaGetDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/status/{cnpj}")
    public ResponseEntity<RegistroPontoColetaGetDTO> buscarStatusPorCnpj(@PathVariable String cnpj) {
        return ResponseEntity.ok(service.buscarStatusPorCnpj(cnpj));
    }

    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<RegistroPontoColetaGetDTO> aprovar(@PathVariable Integer id,
                                                              @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.ok(service.aprovar(id, admin));
    }

    @PatchMapping("/{id}/rejeitar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<RegistroPontoColetaGetDTO> rejeitar(@PathVariable Integer id,
                                                               @RequestBody RejeitarDTO dto,
                                                               @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.ok(service.rejeitar(id, dto.getObservacao(), admin));
    }
}
