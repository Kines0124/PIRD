package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.AdminGetDTO;
import com.pird.pirdBackend.dto.AdminPutDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdministradorService {

    @Autowired
    private AdministradorRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AdminGetDTO buscarPerfil(Integer id) {
        Administrador a = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador não encontrado"));
        return new AdminGetDTO(a);
    }

    public AdminGetDTO atualizarPerfil(Integer id, AdminPutDTO dto) {
        Administrador a = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador não encontrado"));

        if (dto.getNome() != null && !dto.getNome().isBlank())
            a.setNome(dto.getNome());

        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            if (dto.getSenhaAtual() == null || dto.getSenhaAtual().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a senha atual para alterar a senha.");
            if (!passwordEncoder.matches(dto.getSenhaAtual(), a.getSenhaHash()))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta.");
            a.setSenhaHash(passwordEncoder.encode(dto.getSenha()));
        }

        return new AdminGetDTO(repository.save(a));
    }
}
