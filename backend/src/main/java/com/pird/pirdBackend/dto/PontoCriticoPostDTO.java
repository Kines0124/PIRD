package com.pird.pirdBackend.dto;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;

import com.pird.pirdBackend.model.PontoCritico;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PontoCriticoPostDTO {

    private String name;
    private String type;
    private String risk;
    private String description;
    private double lat;
    private double lng;

    public PontoCriticoPostDTO() {}

    public PontoCritico convert() {
        PontoCritico p = new PontoCritico();
        p.setNomeLocal(name);
        p.setTipoRisco(type);
        p.setNivelRisco(risk);
        p.setDescricao(description);
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        p.setLocalizacao(gf.createPoint(new Coordinate(lng, lat)));
        return p;
    }
}
