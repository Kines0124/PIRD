package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.DoacaoGetDTO;
import com.pird.pirdBackend.dto.DoacaoPostDTO;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.service.DoacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doacoes")
public class DoacaoController {

    @Autowired
    private DoacaoService doacaoService;

    @PostMapping
    public ResponseEntity<DoacaoGetDTO> criar(@RequestBody @Valid DoacaoPostDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doacaoService.criar(dto));
    }

    @GetMapping
    public ResponseEntity<List<DoacaoGetDTO>> listar() {
        return ResponseEntity.ok(doacaoService.listarTodas());
    }

    @PatchMapping("/{id}/recebida")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<DoacaoGetDTO> marcarRecebida(@PathVariable Integer id,
                                                       @AuthenticationPrincipal PontoColeta ponto) {
        return ResponseEntity.ok(doacaoService.marcarRecebida(id, ponto));
    }
}
