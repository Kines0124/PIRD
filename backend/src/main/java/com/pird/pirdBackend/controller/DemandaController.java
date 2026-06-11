package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.AtualizarEstoqueDTO;
import com.pird.pirdBackend.dto.AtualizarLimiteDTO;
import com.pird.pirdBackend.dto.DemandaGetDTO;
import com.pird.pirdBackend.dto.DemandaPostDTO;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.service.DemandaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pontos-coleta/meu/demandas")
public class DemandaController {

    @Autowired
    private DemandaService demandaService;

    @GetMapping
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<List<DemandaGetDTO>> listar(@AuthenticationPrincipal PontoColeta ponto) {
        return ResponseEntity.ok(demandaService.listarPorPonto(ponto.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<DemandaGetDTO> criar(@AuthenticationPrincipal PontoColeta ponto,
                                               @RequestBody @Valid DemandaPostDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(demandaService.criar(ponto, dto));
    }

    @PatchMapping("/{id}/estoque")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<DemandaGetDTO> atualizarEstoque(@PathVariable Integer id,
                                                          @AuthenticationPrincipal PontoColeta ponto,
                                                          @RequestBody @Valid AtualizarEstoqueDTO dto) {
        return ResponseEntity.ok(demandaService.atualizarEstoque(id, ponto, dto));
    }

    @PatchMapping("/{id}/limite")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<DemandaGetDTO> atualizarLimite(@PathVariable Integer id,
                                                          @AuthenticationPrincipal PontoColeta ponto,
                                                          @RequestBody @Valid AtualizarLimiteDTO dto) {
        return ResponseEntity.ok(demandaService.atualizarLimite(id, ponto, dto));
    }
}
