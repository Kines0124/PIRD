package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.ConvocacaoGetDTO;
import com.pird.pirdBackend.model.Convocacao;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.repository.ConvocacaoRepository;
import com.pird.pirdBackend.repository.EspecialistaRepository;
import com.pird.pirdBackend.repository.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ConvocacaoService {

    @Autowired
    private ConvocacaoRepository convocacaoRepository;

    @Autowired
    private EspecialistaRepository especialistaRepository;

    @Autowired
    private EventoRepository eventoRepository;

    // ── Convocação automática ─────────────────────────────────────────────────

    /**
     * Convoca automaticamente todos os especialistas disponíveis cujas profissões
     * estejam em {@code evento.profissionaisNecessarios} e residam na mesma cidade
     * do evento (comparação case-insensitive).
     *
     * Pré-requisitos: evento deve ter profissionaisNecessarios e cidade preenchidos.
     */
    @Transactional
    public List<ConvocacaoGetDTO> convocarAutomaticamente(Integer eventoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado"));

        List<String> profissoes = evento.getProfissionaisNecessarios();
        String cidade = evento.getCidade();

        if (profissoes == null || profissoes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Evento sem profissionais necessários definidos — defina-os antes de convocar.");
        }
        if (cidade == null || cidade.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Evento sem cidade definida — necessário para convocação automática por cidade.");
        }

        // Normaliza "Taubaté, SP" → "Taubaté": o geocoder Mapbox retorna cidade com
        // sufixo de estado, mas especialistas armazenam apenas o nome da cidade (via ViaCEP).
        String cidadeNorm = cidade.trim();
        int ufStart = cidadeNorm.lastIndexOf(", ");
        if (ufStart >= 0 && cidadeNorm.substring(ufStart + 2).trim().length() == 2) {
            cidadeNorm = cidadeNorm.substring(0, ufStart).trim();
        }

        List<Convocacao> resultado = new ArrayList<>();

        for (String profissao : profissoes) {
            List<Especialista> candidatos =
                    especialistaRepository.findDisponivelPorProfissaoECidade(profissao, cidadeNorm);

            for (Especialista e : candidatos) {
                if (convocacaoRepository.existsByEventoIdAndEspecialistaId(eventoId, e.getId())) {
                    continue;
                }
                Convocacao c = new Convocacao();
                c.setEvento(evento);
                c.setEspecialista(e);
                c.setStatus("pendente");
                c.setTipo("auto");
                resultado.add(convocacaoRepository.save(c));
            }
        }

        return ConvocacaoGetDTO.convert(resultado);
    }

    // ── Convocação manual (admin convoca um especialista específico) ──────────

    @Transactional
    public ConvocacaoGetDTO convocarManualmente(Integer eventoId, Integer especialistaId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado"));
        Especialista especialista = especialistaRepository.findById(especialistaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Especialista não encontrado"));

        if (convocacaoRepository.existsByEventoIdAndEspecialistaId(eventoId, especialistaId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Especialista já convocado para este evento.");
        }

        Convocacao c = new Convocacao();
        c.setEvento(evento);
        c.setEspecialista(especialista);
        c.setStatus("pendente");
        c.setTipo("auto");
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    // ── Voluntariado (especialista vai sem convocação formal) ─────────────────

    @Transactional
    public ConvocacaoGetDTO voluntariar(Integer eventoId, Especialista especialista) {
        Evento evento = eventoRepository.findById(eventoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado"));

        if (convocacaoRepository.existsByEventoIdAndEspecialistaId(eventoId, especialista.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já possui uma convocação para este evento.");
        }

        // Bloqueia se já está ocupado em outro evento
        boolean ocupado = convocacaoRepository
            .findByEspecialistaIdOrderByConvocadoEmDesc(especialista.getId())
            .stream()
            .anyMatch(c -> "a_caminho".equals(c.getStatus()) || "no_local".equals(c.getStatus()));

        if (ocupado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Você já está em andamento em outro evento.");
        }

        Convocacao c = new Convocacao();
        c.setEvento(evento);
        c.setEspecialista(especialista);
        c.setStatus("a_caminho");
        c.setTipo("voluntario");
        c.setRespondidoEm(LocalDateTime.now());
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    // ── Resposta do especialista ──────────────────────────────────────────────

    @Transactional
    public ConvocacaoGetDTO aceitar(Integer convocacaoId, Especialista especialista) {
        Convocacao c = buscarConvocacaoDoEspecialista(convocacaoId, especialista.getId());
        if (!"pendente".equals(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convocação não está pendente.");
        }

        // Bloqueia se já está ocupado em outro evento
        boolean ocupado = convocacaoRepository
            .findByEspecialistaIdOrderByConvocadoEmDesc(especialista.getId())
            .stream()
            .filter(other -> !other.getId().equals(convocacaoId))
            .anyMatch(other -> "a_caminho".equals(other.getStatus()) || "no_local".equals(other.getStatus()));

        if (ocupado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Você já está em andamento em outro evento. Finalize-o antes de aceitar uma nova convocação.");
        }

        c.setStatus("a_caminho");
        c.setRespondidoEm(LocalDateTime.now());
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    @Transactional
    public ConvocacaoGetDTO recusar(Integer convocacaoId, Especialista especialista) {
        Convocacao c = buscarConvocacaoDoEspecialista(convocacaoId, especialista.getId());
        if (!"pendente".equals(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convocação não está pendente.");
        }
        c.setStatus("recusado");               
        c.setRespondidoEm(LocalDateTime.now());
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    @Transactional
    public ConvocacaoGetDTO confirmarChegada(Integer convocacaoId, Especialista especialista) {
        Convocacao c = buscarConvocacaoDoEspecialista(convocacaoId, especialista.getId());
        if (!"a_caminho".equals(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Só é possível confirmar chegada quando o status for 'a_caminho'.");
        }
        c.setStatus("no_local");
        c.setChegadaEm(LocalDateTime.now());
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    public List<ConvocacaoGetDTO> listarPorEvento(Integer eventoId) {
        return ConvocacaoGetDTO.convert(
                convocacaoRepository.findByEventoIdOrderByConvocadoEmDesc(eventoId));
    }

    public List<ConvocacaoGetDTO> listarMinhas(Integer especialistaId) {
        return ConvocacaoGetDTO.convert(
                convocacaoRepository.findByEspecialistaIdOrderByConvocadoEmDesc(especialistaId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private long contarProfissaoNoEvento(List<Convocacao> lista, String profissao) {
        return lista.stream()
                .filter(c -> profissao.equals(c.getEspecialista().getProfissao()))
                .count();
    }

    private Convocacao buscarConvocacaoDoEspecialista(Integer convocacaoId, Integer especialistaId) {
        Convocacao c = convocacaoRepository.findById(convocacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Convocação não encontrada"));
        if (!c.getEspecialista().getId().equals(especialistaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado a esta convocação.");
        }
        return c;
    }

    public List<ConvocacaoGetDTO> listarTodas() {
    return ConvocacaoGetDTO.convert(
            convocacaoRepository.findAllByOrderByConvocadoEmDesc());
    }

    @Transactional
    public void encerrarPorEvento(Integer eventoId) {
        convocacaoRepository
            .findByEventoIdOrderByConvocadoEmDesc(eventoId)
            .stream()
            .filter(c -> !"recusado".equals(c.getStatus()))  
            .forEach(c -> {
                c.setStatus("recusado");
                convocacaoRepository.save(c);
            });
    }
}
