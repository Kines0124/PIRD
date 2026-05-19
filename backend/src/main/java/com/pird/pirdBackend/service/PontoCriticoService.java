package com.pird.pirdBackend.service;

import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pird.pirdBackend.dto.PontoCriticoGetDTO;
import com.pird.pirdBackend.dto.PontoCriticoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.PontoCritico;
import com.pird.pirdBackend.repository.PontoCriticoRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class PontoCriticoService {

    @Autowired
    private PontoCriticoRepository pontoCriticoRepository;

    public PontoCriticoGetDTO criar(PontoCriticoPostDTO dto, Administrador admin) {
        PontoCritico ponto = dto.convert();
        ponto.setCriadoPor(admin);
        pontoCriticoRepository.save(ponto);
        return new PontoCriticoGetDTO(ponto);
    }

    public List<PontoCriticoGetDTO> listar() {
        return PontoCriticoGetDTO.convert(pontoCriticoRepository.findAll());
    }

    public PontoCriticoGetDTO buscarPorId(Integer id) {
        PontoCritico ponto = pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        return new PontoCriticoGetDTO(ponto);
    }

    public PontoCriticoGetDTO atualizar(Integer id, PontoCriticoPostDTO dto) {
        PontoCritico ponto = pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        ponto.setNomeLocal(dto.getName());
        ponto.setTipoRisco(dto.getType());
        ponto.setNivelRisco(dto.getRisk());
        ponto.setDescricao(dto.getDescription());
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        ponto.setLocalizacao(gf.createPoint(new Coordinate(dto.getLng(), dto.getLat())));
        pontoCriticoRepository.save(ponto);
        return new PontoCriticoGetDTO(ponto);
    }

    public void deletar(Integer id) {
        pontoCriticoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ponto crítico não encontrado"));
        pontoCriticoRepository.deleteById(id);
    }
}
