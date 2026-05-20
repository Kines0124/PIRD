package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.RegistroEspecialistaGetDTO;
import com.pird.pirdBackend.dto.RegistroEspecialistaPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.RegistroEspecialista;
import com.pird.pirdBackend.repository.RegistroEspecialistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroEspecialistaService {

    @Autowired
    private RegistroEspecialistaRepository repository;

    public RegistroEspecialistaGetDTO criar(RegistroEspecialistaPostDTO dto) {
        RegistroEspecialista registro = dto.convert();
        return new RegistroEspecialistaGetDTO(repository.save(registro));
    }

    public List<RegistroEspecialistaGetDTO> listar() {
        return RegistroEspecialistaGetDTO.convert(repository.findAllByOrderByCriadoEmDesc());
    }

    public RegistroEspecialistaGetDTO buscarPorId(Integer id) {
        return new RegistroEspecialistaGetDTO(buscar(id));
    }

    public RegistroEspecialistaGetDTO aprovar(Integer id, Administrador admin) {
        RegistroEspecialista r = buscar(id);
        r.setStatus("aprovado");
        r.setRevisadoEm(LocalDateTime.now());
        r.setRevisadoPor(admin);
        return new RegistroEspecialistaGetDTO(repository.save(r));
    }

    public RegistroEspecialistaGetDTO reprovar(Integer id, String observacao, Administrador admin) {
        RegistroEspecialista r = buscar(id);
        r.setStatus("reprovado");
        r.setObservacao(observacao);
        r.setRevisadoEm(LocalDateTime.now());
        r.setRevisadoPor(admin);
        return new RegistroEspecialistaGetDTO(repository.save(r));
    }

    public void deletar(Integer id) {
        RegistroEspecialista r = buscar(id);
        repository.delete(r);
    }

    private RegistroEspecialista buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro não encontrado"));
    }
}
