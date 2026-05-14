package com.pird.pirdBackend.service;

import org.geolatte.geom.Point;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import com.pird.pirdBackend.dto.VoluntarioDTO;
import com.pird.pirdBackend.model.Voluntario;

@Service
public class VoluntarioService {

    // A GeometryFactory é thread-safe e pode ser um Bean ou estática
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public void cadastrarVoluntario(VoluntarioDTO dto) {
        Voluntario voluntario = new Voluntario();
        voluntario.setNome(dto.nome());
        
        // INSTANCIAÇÃO DO PONTO:
        // Nota: No JTS, o padrão é Coordinate(longitude, latitude)
        Point ponto = geometryFactory.createPoint(new Coordinate(dto.longitude(), dto.latitude()));
        
        voluntario.setLocalizacao(ponto);
        
        repository.save(voluntario);
    }
}