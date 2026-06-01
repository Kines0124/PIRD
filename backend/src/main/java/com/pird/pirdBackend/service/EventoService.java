package com.pird.pirdBackend.service;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pird.pirdBackend.dto.EventoGetDTO;
import com.pird.pirdBackend.dto.EventoPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.model.PontoCritico;
import com.pird.pirdBackend.repository.EventoRepository;
import com.pird.pirdBackend.repository.PontoColetaRepository;
import com.pird.pirdBackend.repository.PontoCriticoRepository;
import com.pird.pirdBackend.dto.EventoRelatorioDTO;
import com.pird.pirdBackend.repository.ConvocacaoRepository;
import com.pird.pirdBackend.model.Convocacao;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EventoService {

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private PontoCriticoRepository pontoCriticoRepository;

    @Autowired
    private PontoColetaRepository pontoColetaRepository;

    @Autowired
    private ConvocacaoRepository convocacaoRepository;

    @Lazy
    @Autowired
    private ConvocacaoService convocacaoService;

    @Transactional
    public EventoGetDTO criar(EventoPostDTO dto, Administrador admin) {

        if ("encerrado".equals(dto.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Não é permitido criar um evento já encerrado."
            );
        }

        Evento evento = dto.convert();
        evento.setCriadoPor(admin);
        vincularPontoCritico(evento, dto);
        associarPontosColeta(evento, dto.getCity());
        eventoRepository.save(evento);
        tentarConvocar(evento);
        return new EventoGetDTO(evento);
    }

    @Transactional(readOnly = true)
    public List<EventoGetDTO> listar() {
        return EventoGetDTO.convert(eventoRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<EventoGetDTO> listarAtivos() {
        return EventoGetDTO.convert(eventoRepository.findByStatus("ativo"));
    }

    @Transactional(readOnly = true)
    public EventoGetDTO buscarPorId(Integer id) {
        Evento evento = eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
        return new EventoGetDTO(evento);
    }

    @Transactional
    public EventoGetDTO atualizar(Integer id, EventoPostDTO dto) {
        Evento evento = eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));

        if ("encerrado".equals(evento.getStatus()) && !"encerrado".equals(dto.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Evento encerrado não pode ser reativado."
            );
        }

        String statusAnterior = evento.getStatus();

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
        vincularPontoCritico(evento, dto);
        associarPontosColeta(evento, dto.getCity());
        eventoRepository.save(evento);

        if ("encerrado".equals(dto.getStatus()) && !"encerrado".equals(statusAnterior)) {
            convocacaoService.encerrarPorEvento(id);
        } else {
            tentarConvocar(evento);
        }

        return new EventoGetDTO(evento);
    }

    public void deletar(Integer id) {
        eventoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
        eventoRepository.deleteById(id);
    }

    // Se criticalPointId vier no DTO usa-o diretamente; caso contrário tenta
    // auto-vincular pelo endereço: verifica se o endereco de algum ponto crítico
    // está contido no endereco do evento (case-insensitive).
    private void vincularPontoCritico(Evento evento, EventoPostDTO dto) {
        if (dto.getCriticalPointId() != null) {
            PontoCritico pc = pontoCriticoRepository.findById(dto.getCriticalPointId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ponto crítico não encontrado."));
            evento.setPontoCritico(pc);
            return;
        }
        evento.setPontoCritico(null);
        String endEvento = evento.getEndereco();
        if (endEvento == null || endEvento.isBlank()) return;
        String endLower = endEvento.toLowerCase();
        pontoCriticoRepository.findAll().stream()
            .filter(pc -> pc.getEndereco() != null && !pc.getEndereco().isBlank())
            .filter(pc -> endLower.contains(pc.getEndereco().toLowerCase()))
            .findFirst()
            .ifPresent(evento::setPontoCritico);
    }

    // Chama convocarAutomaticamente apenas se o evento tiver profissões e cidade
    // definidas — condições que o serviço exige para não lançar exceção.
    private void tentarConvocar(Evento evento) {
        List<String> profissoes = evento.getProfissionaisNecessarios();
        String cidade = evento.getCidade();
        if (profissoes == null || profissoes.isEmpty() || cidade == null || cidade.isBlank()) return;
        convocacaoService.convocarAutomaticamente(evento.getId());
    }

    private void associarPontosColeta(Evento evento, String cidade) {
        if (cidade == null || cidade.isBlank()) {
            evento.setPontosColeta(new ArrayList<>());
            return;
        }
        // O Mapbox retorna cidade no formato "Taubaté, SP"; ViaCEP armazena só "Taubaté".
        // Remove o sufixo ", UF" (2 letras) se estiver presente para garantir a correspondência.
        String cidadeNorm = cidade.trim();
        int ufStart = cidadeNorm.lastIndexOf(", ");
        if (ufStart >= 0 && cidadeNorm.substring(ufStart + 2).trim().length() == 2) {
            cidadeNorm = cidadeNorm.substring(0, ufStart).trim();
        }
        String sufixo = ", " + cidadeNorm;
        List<PontoColeta> pontos = pontoColetaRepository.findAllByValidadoTrue().stream()
            .filter(p -> p.getEndereco() != null &&
                         p.getEndereco().toLowerCase().endsWith(sufixo.toLowerCase()))
            .toList();
        evento.setPontosColeta(new ArrayList<>(pontos));
    }

    /**
     * Monta o relatório oficial de um evento encerrado.
     * Inclui todas as convocações não-recusadas (especialistas que atuaram)
     * e os pontos de coleta vinculados ao evento no momento da consulta.
     */
    @Transactional(readOnly = true)
    public EventoRelatorioDTO gerarRelatorio(Integer id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado"));
 
        List<Convocacao> convocacoes = convocacaoRepository.findByEvento_Id(id);
 
        List<PontoColeta> pontos = evento.getPontosColeta() != null
                ? evento.getPontosColeta()
                : List.of();
 
        return new EventoRelatorioDTO(evento, convocacoes, pontos);
    }
}
