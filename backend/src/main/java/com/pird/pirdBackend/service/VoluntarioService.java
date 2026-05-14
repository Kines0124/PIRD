package com.pird.pirdBackend.service;

import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pird.pirdBackend.dto.VoluntarioGetDTO;
import com.pird.pirdBackend.dto.VoluntarioPostDTO;
import com.pird.pirdBackend.dto.VoluntarioPutDTO;
import com.pird.pirdBackend.model.Voluntario;
import com.pird.pirdBackend.repository.VoluntarioRepository;

import jakarta.persistence.EntityNotFoundException;
import org.locationtech.jts.geom.Point;

@Service
public class VoluntarioService {

    @Autowired
    private VoluntarioRepository voluntarioRepository;

    public VoluntarioGetDTO salvar(VoluntarioPostDTO dto) {

        if (voluntarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email ja existente.");
        } 

        Voluntario voluntario = dto.convert();
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
}