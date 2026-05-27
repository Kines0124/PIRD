package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.EspecialistaGetDTO;
import com.pird.pirdBackend.dto.EspecialistaPutDTO;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.repository.EspecialistaRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EspecialistaService {

    @Autowired
    private EspecialistaRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<EspecialistaGetDTO> listar() {
        return EspecialistaGetDTO.convert(repository.findByDeletadoFalse());
    }

    public EspecialistaGetDTO buscarPorId(Integer id) {
        return new EspecialistaGetDTO(buscar(id));
    }

    public EspecialistaGetDTO atualizar(Integer id, EspecialistaPutDTO dto) {
        Especialista e = buscar(id);

        if (dto.getNome()     != null) e.setNome(dto.getNome());
        if (dto.getTelefone() != null) e.setTelefone(dto.getTelefone());

        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            if (dto.getSenhaAtual() == null || dto.getSenhaAtual().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a senha atual para alterar a senha.");
            if (!passwordEncoder.matches(dto.getSenhaAtual(), e.getSenhaHash()))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta.");
            e.setSenhaHash(passwordEncoder.encode(dto.getSenha()));
        }
        if (dto.getRua()      != null) e.setRua(dto.getRua());
        if (dto.getNumero()   != null) e.setNumero(dto.getNumero());
        if (dto.getBairro()   != null) e.setBairro(dto.getBairro());
        if (dto.getCidade()   != null) e.setCidade(dto.getCidade());
        if (dto.getCep()      != null) e.setCep(dto.getCep());

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
            e.setLocalizacao(gf.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude())));
        }

        return new EspecialistaGetDTO(repository.save(e));
    }

    public void deletar(Integer id) {
        Especialista e = buscar(id);
        e.setDeletado(true);
        repository.save(e);
    }

    private Especialista buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Especialista não encontrado"));
    }
}
