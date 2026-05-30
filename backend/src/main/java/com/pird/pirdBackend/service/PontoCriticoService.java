package com.pird.pirdBackend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pird.pirdBackend.dto.PontoCriticoGetDTO;
import com.pird.pirdBackend.dto.PontoCriticoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.model.PontoCritico;
import com.pird.pirdBackend.repository.EventoRepository;
import com.pird.pirdBackend.repository.PontoCriticoRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class PontoCriticoService {

    @Autowired
    private PontoCriticoRepository pontoCriticoRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Transactional
    public PontoCriticoGetDTO criar(PontoCriticoPostDTO dto, Administrador admin) {
        PontoCritico ponto = dto.convert();
        ponto.setCriadoPor(admin);
        pontoCriticoRepository.save(ponto);
        tentarVincularEventos(ponto);
        return new PontoCriticoGetDTO(ponto);
    }

    @Transactional(readOnly = true)
    public List<PontoCriticoGetDTO> listar() {
        return PontoCriticoGetDTO.convert(pontoCriticoRepository.findAll());
    }

    @Transactional(readOnly = true)
    public PontoCriticoGetDTO buscarPorId(Integer id) {
        PontoCritico ponto = pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        return new PontoCriticoGetDTO(ponto);
    }

    @Transactional
    public PontoCriticoGetDTO atualizar(Integer id, PontoCriticoPostDTO dto) {
        PontoCritico ponto = pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        ponto.setNomeLocal(dto.getName());
        ponto.setTipoRisco(dto.getType());
        ponto.setNivelRisco(dto.getRisk());
        ponto.setDescricao(dto.getDescription());
        ponto.setEndereco(dto.getAddress());
        ponto.setCidade(dto.getCity());
        ponto.setLat(dto.getLat());
        ponto.setLng(dto.getLng());
        pontoCriticoRepository.save(ponto);
        tentarVincularEventos(ponto);
        return new PontoCriticoGetDTO(ponto);
    }

    @Transactional
    public void deletar(Integer id) {
        pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        pontoCriticoRepository.deleteById(id);
    }

    // Ao criar ou editar um ponto crítico, vincula automaticamente eventos cujo
    // endereco contenha o endereco deste ponto (ainda sem vínculo existente).
    private void tentarVincularEventos(PontoCritico ponto) {
        String enderecoPc = ponto.getEndereco();
        if (enderecoPc == null || enderecoPc.isBlank()) return;
        String pcLower = enderecoPc.toLowerCase();
        List<Evento> eventos = eventoRepository.findAll();
        for (Evento evento : eventos) {
            if (evento.getPontoCritico() != null) continue;
            String endEvento = evento.getEndereco();
            if (endEvento != null && endEvento.toLowerCase().contains(pcLower)) {
                evento.setPontoCritico(ponto);
                eventoRepository.save(evento);
            }
        }
    }
}
