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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.DemandaGetDTO;
import com.pird.pirdBackend.dto.DoacaoGetDTO;
import com.pird.pirdBackend.dto.PontoColetaGetDTO;
import com.pird.pirdBackend.dto.PontoColetaPutDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.service.DemandaService;
import com.pird.pirdBackend.service.DoacaoService;
import com.pird.pirdBackend.service.PontoColetaService;

@RestController
@RequestMapping("/pontos-coleta")
public class PontoColetaController {

    @Autowired
    private PontoColetaService pontoColetaService;

    @Autowired
    private DemandaService demandaService;

    @Autowired
    private DoacaoService doacaoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PontoColetaGetDTO>> listar() {
        return ResponseEntity.ok(pontoColetaService.listar());
    }

    @GetMapping("/validados")
    public ResponseEntity<List<PontoColetaGetDTO>> listarValidados() {
        return ResponseEntity.ok(pontoColetaService.listarValidados());
    }

    @GetMapping("/{id}/demandas")
    public ResponseEntity<List<DemandaGetDTO>> demandas(@PathVariable Integer id) {
        return ResponseEntity.ok(demandaService.listarPorPonto(id));
    }

    @GetMapping("/meu")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<PontoColetaGetDTO> meuPerfil(@AuthenticationPrincipal PontoColeta ponto) {
        return ResponseEntity.ok(pontoColetaService.buscarPerfil(ponto));
    }

    @PutMapping("/meu")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<PontoColetaGetDTO> atualizarMeuPerfil(
            @AuthenticationPrincipal PontoColeta ponto,
            @RequestBody PontoColetaPutDTO dto) {
        return ResponseEntity.ok(pontoColetaService.atualizarMeu(ponto, dto));
    }

    @GetMapping("/meu/doacoes")
    @PreAuthorize("hasRole('PONTO_COLETA')")
    public ResponseEntity<List<DoacaoGetDTO>> minhasDoacoes(@AuthenticationPrincipal PontoColeta ponto) {
        return ResponseEntity.ok(doacaoService.listarPorPonto(ponto.getId()));
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
