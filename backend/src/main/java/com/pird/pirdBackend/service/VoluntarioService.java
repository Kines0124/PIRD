package com.pird.pirdBackend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.pird.pirdBackend.dto.VoluntarioGetDTO;
import com.pird.pirdBackend.dto.VoluntarioPostDTO;
import com.pird.pirdBackend.dto.VoluntarioPutDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Voluntario;
import com.pird.pirdBackend.repository.EventoRepository;
import com.pird.pirdBackend.repository.VoluntarioRepository;

import jakarta.persistence.EntityNotFoundException;
import org.locationtech.jts.geom.Point;

@Service
public class VoluntarioService {

    @Autowired
    private VoluntarioRepository voluntarioRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public VoluntarioGetDTO salvar(VoluntarioPostDTO dto) {

        if (eventoRepository.existsByStatusIn(List.of("ativo", "monitoramento"))) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cadastro temporariamente bloqueado durante eventos ativos.");
        }

        if (voluntarioRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }

        Voluntario voluntario = dto.convert();
        voluntario.setSenhaHash(passwordEncoder.encode(dto.getSenha()));
        voluntarioRepository.save(voluntario);
        return new VoluntarioGetDTO(voluntario);
    }

    public List<VoluntarioGetDTO> listar() {
        List<Voluntario> lista = voluntarioRepository.findAll();
        return VoluntarioGetDTO.convert(lista);
    }

    public VoluntarioGetDTO buscarPorId(Integer id) {
        Voluntario voluntario = voluntarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Voluntário não encontrado"));
        return new VoluntarioGetDTO(voluntario); 
    }

    public VoluntarioGetDTO atualizar(Integer id, VoluntarioPutDTO dto) {
        Voluntario voluntario = voluntarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Voluntário não encontrado"));

        voluntario.setNome(dto.getNome());
        voluntario.setEspecialidade(dto.getEspecialidade());

        // remonta o Point se lat/lng foram enviados
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        Point ponto = gf.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
        voluntario.setLocalizacao(ponto);

        voluntarioRepository.save(voluntario);
        return new VoluntarioGetDTO(voluntario);
    }

    public void deletar(Integer id) {
        voluntarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Voluntário não encontrado"));
        voluntarioRepository.deleteById(id);
    }

    public VoluntarioGetDTO validar(Integer id, Administrador admin) {
        Voluntario voluntario = voluntarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Voluntário não encontrado"));
        voluntario.setValidado(true);
        voluntario.setValidadoEm(LocalDateTime.now());
        voluntario.setValidadoPor(admin);
        voluntarioRepository.save(voluntario);
        return new VoluntarioGetDTO(voluntario);
    }
}