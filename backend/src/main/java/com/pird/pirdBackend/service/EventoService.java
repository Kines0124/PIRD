package com.pird.pirdBackend.service;

import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.pird.pirdBackend.dto.EventoGetDTO;
import com.pird.pirdBackend.dto.EventoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.model.PontoCritico;
import com.pird.pirdBackend.repository.EventoRepository;
import com.pird.pirdBackend.repository.PontoCriticoRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EventoService {

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private PontoCriticoRepository pontoCriticoRepository;

    public EventoGetDTO criar(EventoPostDTO dto, Administrador admin) {
        Evento evento = dto.convert();
        evento.setCriadoPor(admin);
        if (dto.getCriticalPointId() != null) {
            PontoCritico pc = pontoCriticoRepository.findById(dto.getCriticalPointId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ponto crítico não encontrado."));
            evento.setPontoCritico(pc);
        }
        eventoRepository.save(evento);
        return new EventoGetDTO(evento);
    }

    public List<EventoGetDTO> listar() {
        return EventoGetDTO.convert(eventoRepository.findAll());
    }

    public List<EventoGetDTO> listarAtivos() {
        return EventoGetDTO.convert(eventoRepository.findByStatus("ativo"));
    }

    public EventoGetDTO buscarPorId(Integer id) {
        Evento evento = eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
        return new EventoGetDTO(evento);
    }

    public EventoGetDTO atualizar(Integer id, EventoPostDTO dto) {
        Evento evento = eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
        evento.setTitulo(dto.getTitle());
        evento.setTipo(dto.getType());
        evento.setSeveridade(dto.getSeverity());
        evento.setCidade(dto.getCity());
        evento.setDescricao(dto.getDescription());
        evento.setStatus(dto.getStatus());
        evento.setVitimasEstimadas(dto.getVictims());
        evento.setEndereco(dto.getAddress());
        evento.setProfissionaisNecessarios(dto.getNeededProfiles());
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        evento.setLocalizacao(gf.createPoint(new Coordinate(dto.getLng(), dto.getLat())));
        if (dto.getCriticalPointId() != null) {
            pontoCriticoRepository.findById(dto.getCriticalPointId())
                .ifPresent(evento::setPontoCritico);
        } else {
            evento.setPontoCritico(null);
        }
        eventoRepository.save(evento);
        return new EventoGetDTO(evento);
    }

    public void deletar(Integer id) {
        eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
        eventoRepository.deleteById(id);
    }
}
