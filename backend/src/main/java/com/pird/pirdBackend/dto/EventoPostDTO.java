package com.pird.pirdBackend.dto;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;

import com.pird.pirdBackend.model.Evento;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventoPostDTO {

    private String title;
    private String type;
    private String severity;
    private String city;
    private String description;
    private String status;
    private double lat;
    private double lng;
    private Integer criticalPointId;
    private int victims;

    public EventoPostDTO() {}

    public Evento convert() {
        Evento e = new Evento();
        e.setTitulo(title);
        e.setTipo(type);
        e.setSeveridade(severity != null ? severity : "medio");
        e.setCidade(city);
        e.setDescricao(description);
        e.setStatus(status != null ? status : "ativo");
        e.setVitimasEstimadas(victims);
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        e.setLocalizacao(gf.createPoint(new Coordinate(lng, lat)));
        return e;
    }
}
