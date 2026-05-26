package com.pird.pirdBackend.service;

import com.pird.pirdBackend.config.ConvocacaoConfig;
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
     * Executa a convocação automática para um evento:
     *
     *  1. Especialistas são buscados em raio crescente (1→2→4→...→32km).
     *  2. Dentro de cada raio, profissões são percorridas em ordem de prioridade
     *     (P1, P2, P3) conforme ConvocacaoConfig.
     *  3. Apenas especialistas sem convocação ativa (pendente/aceita) são elegíveis.
     *  4. Psicólogo e Assistente Social: máximo 1 por evento.
     *  5. Teto absoluto por severidade: moderado=5, alto=8, crítico=10.
     *  6. Mínimos por tier variam com a criticidade.
     */
    @Transactional
    public List<ConvocacaoGetDTO> convocarAutomaticamente(Integer eventoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado"));

        String tipo      = evento.getTipo();
        String severidade = evento.getSeveridade();
        int sevIdx = ConvocacaoConfig.SEV_INDEX.getOrDefault(severidade, 0);
        int teto   = ConvocacaoConfig.TETO.getOrDefault(severidade, 5);

        List<List<String>> tiers = ConvocacaoConfig.PRIORIDADE.getOrDefault(tipo, List.of());

        if (evento.getLocalizacao() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Evento sem coordenadas — não é possível calcular raio de busca.");
        }

        double lat = evento.getLocalizacao().getY();
        double lng = evento.getLocalizacao().getX();

        List<Convocacao> resultado = new ArrayList<>();
        double raioKm = ConvocacaoConfig.RAIO_INICIAL_KM;

        while (resultado.size() < teto && raioKm <= ConvocacaoConfig.RAIO_MAXIMO_KM) {
            double raioMetros = raioKm * 1000;

            for (int t = 0; t < tiers.size() && resultado.size() < teto; t++) {
                int minimoTier = ConvocacaoConfig.MINIMO_POR_TIER[sevIdx][Math.min(t, 2)];

                for (String profissao : tiers.get(t)) {
                    if (resultado.size() >= teto) break;

                    Set<String> elegivel = ConvocacaoConfig.ELEGIBILIDADE.getOrDefault(profissao, Set.of());
                    if (!elegivel.contains(tipo)) continue;

                    // Profissões com limite de 1 por evento
                    if (ConvocacaoConfig.LIMITE_UM_POR_EVENTO.contains(profissao)) {
                        long jaConvocados = contarProfissaoNoEvento(resultado, profissao)
                                + convocacaoRepository.countByEventoIdAndEspecialistaProfissaoAndStatusIn(
                                    eventoId, profissao, List.of("pendente", "aceita"));
                        if (jaConvocados >= 1) continue;
                    }

                    int vagasDisponiveis = teto - resultado.size();
                    int solicitar = Math.max(minimoTier, 1);
                    int limite = Math.min(solicitar, vagasDisponiveis);

                    List<Especialista> candidatos = especialistaRepository
                            .findDisponiveisDentroDoRaio(profissao, lat, lng, raioMetros);

                    for (Especialista e : candidatos.stream().limit(limite).toList()) {
                        // Evita duplicata caso o mesmo especialista apareça em tiers diferentes
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
            }

            raioKm *= 2;
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
        c.setTipo("manual");
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    // ── Resposta do especialista ──────────────────────────────────────────────

    @Transactional
    public ConvocacaoGetDTO aceitar(Integer convocacaoId, Especialista especialista) {
        Convocacao c = buscarConvocacaoDoEspecialista(convocacaoId, especialista.getId());
        if (!"pendente".equals(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convocação não está pendente.");
        }
        c.setStatus("aceita");
        c.setRespondidoEm(LocalDateTime.now());
        return new ConvocacaoGetDTO(convocacaoRepository.save(c));
    }

    @Transactional
    public ConvocacaoGetDTO recusar(Integer convocacaoId, Especialista especialista) {
        Convocacao c = buscarConvocacaoDoEspecialista(convocacaoId, especialista.getId());
        if (!"pendente".equals(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convocação não está pendente.");
        }
        c.setStatus("recusada");
        c.setRespondidoEm(LocalDateTime.now());
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
}
