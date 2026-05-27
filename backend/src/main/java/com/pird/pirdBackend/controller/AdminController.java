package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.AdminGetDTO;
import com.pird.pirdBackend.dto.AdminPutDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.service.AdministradorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdministradorService administradorService;

    @GetMapping("/perfil")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AdminGetDTO> getPerfil(@AuthenticationPrincipal Administrador admin) {
        return ResponseEntity.ok(administradorService.buscarPerfil(admin.getId()));
    }

    @PutMapping("/perfil")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AdminGetDTO> putPerfil(@AuthenticationPrincipal Administrador admin,
                                                  @RequestBody AdminPutDTO dto) {
        return ResponseEntity.ok(administradorService.atualizarPerfil(admin.getId(), dto));
    }
}
