package com.pird.pirdBackend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pird.pirdBackend.dto.PontoColetaGetDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.repository.PontoColetaRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class PontoColetaService {

    @Autowired
    private PontoColetaRepository pontoColetaRepository;

    public List<PontoColetaGetDTO> listar() {
        return PontoColetaGetDTO.convert(pontoColetaRepository.findAll());
    }

    public List<PontoColetaGetDTO> listarValidados() {
        return PontoColetaGetDTO.convert(pontoColetaRepository.findAllByValidadoTrue());
    }

    public PontoColetaGetDTO buscarPorId(Integer id) {
        PontoColeta ponto = pontoColetaRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto de coleta não encontrado"));
        return new PontoColetaGetDTO(ponto);
    }

    public PontoColetaGetDTO buscarPerfil(PontoColeta ponto) {
        return new PontoColetaGetDTO(ponto);
    }

    public PontoColetaGetDTO validar(Integer id, Administrador admin) {
        PontoColeta ponto = pontoColetaRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto de coleta não encontrado"));
        ponto.setValidado(true);
        ponto.setValidadoEm(LocalDateTime.now());
        ponto.setValidadoPor(admin);
        pontoColetaRepository.save(ponto);
        return new PontoColetaGetDTO(ponto);
    }

    public void deletar(Integer id) {
        pontoColetaRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto de coleta não encontrado"));
        pontoColetaRepository.deleteById(id);
    }
}
