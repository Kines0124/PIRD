package com.pird.pirdBackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.VoluntarioGetDTO;
import com.pird.pirdBackend.dto.VoluntarioPostDTO;
import com.pird.pirdBackend.service.VoluntarioService;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/voluntarios")
public class VoluntarioController {

@Autowired
VoluntarioService voluntarioService;

    @PostMapping
    public ResponseEntity<VoluntarioGetDTO> salvar(@RequestBody @Valid VoluntarioPostDTO dto){
        VoluntarioGetDTO voluntario = voluntarioService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(voluntario);
    }
    
}
