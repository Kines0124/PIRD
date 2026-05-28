package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.RegistroPontoColetaGetDTO;
import com.pird.pirdBackend.dto.RegistroPontoColetaPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.model.RegistroPontoColeta;
import com.pird.pirdBackend.repository.PontoColetaRepository;
import com.pird.pirdBackend.repository.RegistroPontoColetaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroPontoColetaService {

    @Autowired
    private RegistroPontoColetaRepository repository;

    @Autowired
    private PontoColetaRepository pontoColetaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public RegistroPontoColetaGetDTO criar(RegistroPontoColetaPostDTO dto) {
        RegistroPontoColeta reg = new RegistroPontoColeta();
        reg.setNomeLocal(dto.getNomeLocal());
        reg.setCnpj(dto.getCnpj());
        reg.setTelefone(dto.getTelefone());
        reg.setEmail(dto.getEmail());
        reg.setRua(dto.getRua());
        reg.setNumero(dto.getNumero());
        reg.setBairro(dto.getBairro());
        reg.setCidade(dto.getCidade());
        reg.setCep(dto.getCep());
        reg.setTipoPonto(dto.isTipoPonto());
        reg.setStatus("pendente");
        repository.save(reg);
        return new RegistroPontoColetaGetDTO(reg);
    }

    public List<RegistroPontoColetaGetDTO> listar() {
        return RegistroPontoColetaGetDTO.convert(repository.findAll());
    }

    public RegistroPontoColetaGetDTO buscarPorId(Integer id) {
        return new RegistroPontoColetaGetDTO(
            repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"))
        );
    }

    public RegistroPontoColetaGetDTO buscarStatusPorCnpj(String cnpj) {
        RegistroPontoColeta reg = repository.findByCnpj(cnpj);
        if (reg == null) throw new EntityNotFoundException("Registro não encontrado para o CNPJ informado");
        return new RegistroPontoColetaGetDTO(reg);
    }

    public RegistroPontoColetaGetDTO aprovar(Integer id, Administrador admin) {
        RegistroPontoColeta reg = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"));

        PontoColeta ponto = new PontoColeta();
        ponto.setNomeLocal(reg.getNomeLocal());
        ponto.setCnpj(reg.getCnpj());
        ponto.setEmail(reg.getEmail() != null ? reg.getEmail()
                       : reg.getCnpj().replaceAll("[^\\d]", "") + "@ponto.pird");
        ponto.setTelefone(reg.getTelefone());
        ponto.setEndereco(buildEndereco(reg));
        ponto.setTipoPonto(reg.isTipoPonto());
        ponto.setSenhaHash(passwordEncoder.encode("password"));
        ponto.setValidado(true);
        ponto.setAtivo(true);
        ponto.setValidadoEm(LocalDateTime.now());
        ponto.setValidadoPor(admin);

        // localização padrão: centro de Taubaté
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        Point loc = gf.createPoint(new Coordinate(-45.5533, -23.0268));
        ponto.setLocalizacao(loc);

        pontoColetaRepository.save(ponto);

        reg.setStatus("aprovado");
        reg.setRevisadoEm(LocalDateTime.now());
        reg.setRevisadoPor(admin);
        repository.save(reg);

        return new RegistroPontoColetaGetDTO(reg);
    }

    public RegistroPontoColetaGetDTO rejeitar(Integer id, String observacao, Administrador admin) {
        RegistroPontoColeta reg = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"));
        reg.setStatus("rejeitado");
        reg.setObservacao(observacao);
        reg.setRevisadoEm(LocalDateTime.now());
        reg.setRevisadoPor(admin);
        repository.save(reg);
        return new RegistroPontoColetaGetDTO(reg);
    }

    private String buildEndereco(RegistroPontoColeta reg) {
        StringBuilder sb = new StringBuilder();
        if (reg.getRua()    != null) sb.append(reg.getRua());
        if (reg.getNumero() != null) sb.append(", ").append(reg.getNumero());
        if (reg.getBairro() != null) sb.append(" — ").append(reg.getBairro());
        if (reg.getCidade() != null) sb.append(", ").append(reg.getCidade());
        return sb.toString();
    }
}
