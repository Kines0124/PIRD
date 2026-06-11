package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.RotaGetDTO;
import com.pird.pirdBackend.model.Convocacao;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.repository.ConvocacaoRepository;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RotaService {

    @Autowired
    private ConvocacaoRepository convocacaoRepository;

    @Autowired
    private MapboxService mapboxService;

    @Transactional(readOnly = true)
    public RotaGetDTO obterRotaConvocacao(Integer convId, Especialista especialista) {
        Convocacao conv = convocacaoRepository.findById(convId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Convocação não encontrada."));

        if (!conv.getEspecialista().getId().equals(especialista.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Acesso negado a esta convocação.");
        }
        if (!"a_caminho".equals(conv.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A rota só está disponível quando o status for 'a_caminho'.");
        }

        // JTS Point: getX() = longitude, getY() = latitude
        Point origem = especialista.getLocalizacao();
        if (origem == null) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Sua localização não está cadastrada. Atualize seu endereço no perfil.");
        }

        Point destino = conv.getEvento().getLocalizacao();
        if (destino == null) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Localização do evento não disponível.");
        }

        return mapboxService.obterRota(
            origem.getY(), origem.getX(),
            destino.getY(), destino.getX()
        );
    }
}
