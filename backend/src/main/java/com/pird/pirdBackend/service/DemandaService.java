package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.AtualizarEstoqueDTO;
import com.pird.pirdBackend.dto.AtualizarLimiteDTO;
import com.pird.pirdBackend.dto.DemandaGetDTO;
import com.pird.pirdBackend.dto.DemandaPostDTO;
import com.pird.pirdBackend.model.Demanda;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.repository.DemandaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DemandaService {

    @Autowired
    private DemandaRepository demandaRepository;

    public List<DemandaGetDTO> listarPorPonto(Integer pontoColetaId) {
        return DemandaGetDTO.convert(demandaRepository.findByPontoColetaId(pontoColetaId));
    }

    public DemandaGetDTO criar(PontoColeta ponto, DemandaPostDTO dto) {
        Demanda d = new Demanda();
        d.setPontoColeta(ponto);
        d.setCategoria(dto.getCategoria());
        d.setDescricaoItem(dto.getDescricaoItem());
        d.setQuantidadeDemanda(dto.getQuantidadeDemanda());
        d.setPrioridade(dto.getPrioridade());
        demandaRepository.save(d);
        return new DemandaGetDTO(d);
    }

    @Transactional
    public DemandaGetDTO atualizarEstoque(Integer demandaId, PontoColeta ponto, AtualizarEstoqueDTO dto) {
        Demanda d = demandaRepository.findById(demandaId)
            .orElseThrow(() -> new EntityNotFoundException("Demanda não encontrada"));
        if (!d.getPontoColeta().getId().equals(ponto.getId())) {
            throw new SecurityException("Demanda não pertence a este ponto de coleta");
        }
        d.setQuantidadeRecebida(d.getQuantidadeRecebida() + dto.getQuantidadeRecebida());
        demandaRepository.save(d);
        return new DemandaGetDTO(d);
    }

    @Transactional
    public DemandaGetDTO atualizarLimite(Integer demandaId, PontoColeta ponto, AtualizarLimiteDTO dto) {
        Demanda d = demandaRepository.findById(demandaId)
            .orElseThrow(() -> new EntityNotFoundException("Demanda não encontrada"));
        if (!d.getPontoColeta().getId().equals(ponto.getId())) {
            throw new SecurityException("Demanda não pertence a este ponto de coleta");
        }
        if (dto.getQuantidadeDemanda() < d.getQuantidadeRecebida()) {
            throw new IllegalArgumentException(
                "Não é possível reduzir o limite abaixo do estoque já recebido: " + d.getCategoria()
            );
        }
        d.setQuantidadeDemanda(dto.getQuantidadeDemanda());
        demandaRepository.save(d);
        return new DemandaGetDTO(d);
    }
}
