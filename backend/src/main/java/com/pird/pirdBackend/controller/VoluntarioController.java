package com.pird.pirdBackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.VoluntarioGetDTO;
import com.pird.pirdBackend.dto.VoluntarioPostDTO;
import com.pird.pirdBackend.dto.VoluntarioPutDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.VoluntarioService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * Controller de Voluntários.
 *
 * Regras de acesso:
 *   POST   /voluntarios         → público (auto-cadastro)
 *   GET    /voluntarios         → requer ROLE_ADMINISTRADOR
 *   GET    /voluntarios/{id}    → requer ROLE_ADMINISTRADOR
 *   PUT    /voluntarios/{id}    → requer ROLE_ADMINISTRADOR
 *   DELETE /voluntarios/{id}    → requer ROLE_ADMINISTRADOR
 */
@RestController
@RequestMapping("/voluntarios")
@Tag(name = "Voluntários", description = "CRUD de voluntários")
public class VoluntarioController {

    @Autowired
    private VoluntarioService voluntarioService;

    @PostMapping
    @Operation(summary = "Cadastrar voluntário", description = "Endpoint público — qualquer pessoa pode se cadastrar")
    public ResponseEntity<VoluntarioGetDTO> salvar(@RequestBody @Valid VoluntarioPostDTO dto) {
        VoluntarioGetDTO voluntario = voluntarioService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(voluntario);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Listar voluntários", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<VoluntarioGetDTO>> listarTodos() {
        return ResponseEntity.ok(voluntarioService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Buscar voluntário por ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<VoluntarioGetDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(voluntarioService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Atualizar voluntário", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<VoluntarioGetDTO> atualizar(@PathVariable Integer id,
                                                       @RequestBody @Valid VoluntarioPutDTO dto) {
        return ResponseEntity.ok(voluntarioService.atualizar(id, dto));
    }

    @PatchMapping("/{id}/validar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Validar voluntário", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<VoluntarioGetDTO> validar(@PathVariable Integer id,
                                                     @AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.ok(voluntarioService.validar(id, admin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Remover voluntário", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        voluntarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}