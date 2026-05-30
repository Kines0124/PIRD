package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.ConvocacaoGetDTO;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.service.ConvocacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints de convocação de especialistas para eventos.
 *
 * POST /convocacoes/evento/{eventoId}/auto      → admin — dispara convocação automática
 * POST /convocacoes/evento/{eventoId}/manual    → admin — convoca especialista específico
 * GET  /convocacoes/evento/{eventoId}           → admin — lista convocações do evento
 * GET  /convocacoes/minhas                      → especialista — lista próprias convocações
 * PATCH /convocacoes/{id}/aceitar               → especialista — aceita convocação
 * PATCH /convocacoes/{id}/recusar               → especialista — recusa convocação
 */
@RestController
@RequestMapping("/convocacoes")
public class ConvocacaoController {

    @Autowired
    private ConvocacaoService service;

    @PostMapping("/evento/{eventoId}/auto")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ConvocacaoGetDTO>> convocarAuto(@PathVariable Integer eventoId) {
        return ResponseEntity.ok(service.convocarAutomaticamente(eventoId));
    }

    @PostMapping("/evento/{eventoId}/manual")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ConvocacaoGetDTO> convocarManual(
            @PathVariable Integer eventoId,
            @RequestBody Map<String, Integer> body) {
        Integer especialistaId = body.get("especialistaId");
        return ResponseEntity.ok(service.convocarManualmente(eventoId, especialistaId));
    }

    @GetMapping("/evento/{eventoId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ConvocacaoGetDTO>> listarPorEvento(@PathVariable Integer eventoId) {
        return ResponseEntity.ok(service.listarPorEvento(eventoId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ConvocacaoGetDTO>> listarTodas() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/minhas")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<List<ConvocacaoGetDTO>> listarMinhas(
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.listarMinhas(especialista.getId()));
    }

    @PostMapping("/evento/{eventoId}/voluntario")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<ConvocacaoGetDTO> voluntariar(
            @PathVariable Integer eventoId,
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.voluntariar(eventoId, especialista));
    }

    @PatchMapping("/{id}/aceitar")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<ConvocacaoGetDTO> aceitar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.aceitar(id, especialista));
    }

    @PatchMapping("/{id}/recusar")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<ConvocacaoGetDTO> recusar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.recusar(id, especialista));
    }

    @PatchMapping("/{id}/chegada")
    @PreAuthorize("hasRole('ESPECIALISTA')")
    public ResponseEntity<ConvocacaoGetDTO> confirmarChegada(
            @PathVariable Integer id,
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(service.confirmarChegada(id, especialista));
    }
}
