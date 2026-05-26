package com.pird.pirdBackend.service;

import com.pird.pirdBackend.dto.RegistroEspecialistaGetDTO;
import com.pird.pirdBackend.dto.RegistroEspecialistaPostDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.model.RegistroEspecialista;
import com.pird.pirdBackend.repository.EspecialistaRepository;
import com.pird.pirdBackend.repository.RegistroEspecialistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroEspecialistaService {

    @Autowired
    private RegistroEspecialistaRepository repository;

    @Autowired
    private EspecialistaRepository especialistaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public RegistroEspecialistaGetDTO criar(RegistroEspecialistaPostDTO dto) {
        if (dto.getEmail() != null && especialistaRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado como especialista.");
        }
        RegistroEspecialista registro = dto.convert();
        return new RegistroEspecialistaGetDTO(repository.save(registro));
    }

    public List<RegistroEspecialistaGetDTO> listar() {
        return RegistroEspecialistaGetDTO.convert(repository.findAllByOrderByCriadoEmDesc());
    }

    public RegistroEspecialistaGetDTO buscarPorId(Integer id) {
        return new RegistroEspecialistaGetDTO(buscar(id));
    }

    /**
     * Aprova o registro: cria um Especialista com as credenciais do registro
     * e atualiza o status para 'aprovado'. O registro permanece como auditoria.
     */
    @Transactional
    public RegistroEspecialistaGetDTO aprovar(Integer id, Administrador admin) {
        RegistroEspecialista r = buscar(id);

        if ("aprovado".equals(r.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registro já aprovado.");
        }
        if (r.getEmail() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Registro sem e-mail — não é possível criar conta de especialista.");
        }
        if (especialistaRepository.existsByEmail(r.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe um especialista com este e-mail.");
        }

        Especialista especialista = new Especialista();
        especialista.setRegistro(r);
        especialista.setNome(r.getNome());
        especialista.setEmail(r.getEmail());
        especialista.setSenhaHash(passwordEncoder.encode("password"));
        especialista.setProfissao(r.getProfissao());
        especialista.setCpf(r.getCpf());
        especialista.setTelefone(r.getTelefone());
        especialista.setNumeroRegistro(r.getNumeroRegistro());
        especialista.setUf(r.getUf());
        especialista.setRua(r.getRua());
        especialista.setNumero(r.getNumero());
        especialista.setBairro(r.getBairro());
        especialista.setCidade(r.getCidade());
        especialista.setCep(r.getCep());
        especialistaRepository.save(especialista);

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
        repository.delete(buscar(id));
    }

    private RegistroEspecialista buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro não encontrado"));
    }
}
