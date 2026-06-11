package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.RegistroEspecialistaGetDTO;
import com.pird.pirdBackend.dto.RegistroEspecialistaPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.RegistroEspecialistaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/especialistas")
public class RegistroEspecialistaController {

    @Autowired
    private RegistroEspecialistaService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistroEspecialistaGetDTO criar(@RequestBody RegistroEspecialistaPostDTO dto) {
        return service.criar(dto);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<RegistroEspecialistaGetDTO> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public RegistroEspecialistaGetDTO buscarPorId(@PathVariable Integer id) {
        return service.buscarPorId(id);
    }

    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public RegistroEspecialistaGetDTO aprovar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Administrador admin) {
        return service.aprovar(id, admin);
    }

    @PatchMapping("/{id}/reprovar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public RegistroEspecialistaGetDTO reprovar(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Administrador admin) {
        String observacao = body.getOrDefault("observacao", "");
        return service.reprovar(id, observacao, admin);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Integer id) {
        service.deletar(id);
    }
}
