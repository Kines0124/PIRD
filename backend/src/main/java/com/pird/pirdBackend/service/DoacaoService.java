package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.DoacaoGetDTO;
import com.pird.pirdBackend.dto.DoacaoPostDTO;
import com.pird.pirdBackend.model.Demanda;
import com.pird.pirdBackend.model.Doacao;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.repository.DemandaRepository;
import com.pird.pirdBackend.repository.DoacaoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoacaoService {

    @Autowired
    private DoacaoRepository doacaoRepository;

    @Autowired
    private DemandaRepository demandaRepository;

    public DoacaoGetDTO criar(DoacaoPostDTO dto) {
        Demanda demanda = demandaRepository.findById(dto.getDemandaId())
            .orElseThrow(() -> new EntityNotFoundException("Demanda não encontrada"));

        Doacao d = new Doacao();
        d.setDemanda(demanda);
        d.setDescricaoItem(dto.getDescricaoItem());
        d.setNomeDoador(dto.getNomeDoador());
        d.setContatoDoador(dto.getContatoDoador());
        d.setQuantidade(dto.getQuantidade());
        doacaoRepository.save(d);
        return new DoacaoGetDTO(d);
    }

    public List<DoacaoGetDTO> listarPorPonto(Integer pontoColetaId) {
        return DoacaoGetDTO.convert(doacaoRepository.findByDemandaPontoColetaId(pontoColetaId));
    }

    public List<DoacaoGetDTO> listarTodas() {
        return DoacaoGetDTO.convert(doacaoRepository.findAll());
    }

    @Transactional
    public DoacaoGetDTO marcarRecebida(Integer doacaoId, PontoColeta ponto) {
        Doacao d = doacaoRepository.findById(doacaoId)
            .orElseThrow(() -> new EntityNotFoundException("Doação não encontrada"));
        if (!d.getDemanda().getPontoColeta().getId().equals(ponto.getId())) {
            throw new SecurityException("Doação não pertence a este ponto de coleta");
        }
        if ("recebida".equals(d.getStatus())) {
            return new DoacaoGetDTO(d);
        }
        d.setStatus("recebida");
        doacaoRepository.save(d);

        Demanda demanda = d.getDemanda();
        demanda.setQuantidadeRecebida(demanda.getQuantidadeRecebida() + d.getQuantidade());
        demandaRepository.save(demanda);

        return new DoacaoGetDTO(d);
    }
}
