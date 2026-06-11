package com.pird.pirdBackend.controller;

import com.pird.pirdBackend.dto.RotaGetDTO;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.service.RotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rota")
public class RotaController {

    @Autowired
    private RotaService rotaService;

    /**
     * Retorna a rota Mapbox Directions (driving) do endereço do especialista
     * até o local do evento vinculado à convocação informada.
     * Exige que a convocação esteja com status "a_caminho".
     */
    @GetMapping("/convocacao/{id}")
    public ResponseEntity<RotaGetDTO> obterRota(
            @PathVariable Integer id,
            @AuthenticationPrincipal Especialista especialista) {
        return ResponseEntity.ok(rotaService.obterRotaConvocacao(id, especialista));
    }
}
