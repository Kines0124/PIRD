package com.pird.pirdBackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pird.pirdBackend.dto.EventoFotoGetDTO;
import com.pird.pirdBackend.service.EventoFotoService;

@RestController
@RequestMapping("/eventos")
public class EventoFotoController {

    @Autowired
    private EventoFotoService eventoFotoService;

    @PostMapping(value = "/{id}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EventoFotoGetDTO> upload(
            @PathVariable Integer id,
            @RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoFotoService.uploadFoto(id, arquivo));
    }

    @GetMapping("/{id}/fotos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<EventoFotoGetDTO>> listar(@PathVariable Integer id) {
        return ResponseEntity.ok(eventoFotoService.listarFotos(id));
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> remover(
            @PathVariable Integer id,
            @PathVariable Integer fotoId) {
        eventoFotoService.removerFoto(id, fotoId);
        return ResponseEntity.noContent().build();
    }
}
