package com.pird.pirdBackend.dto;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;

import com.pird.pirdBackend.model.Evento;

import java.util.ArrayList;
import java.util.List;

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
    private String address;
    private List<String> neededProfiles = new ArrayList<>();

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
        e.setEndereco(address);
        e.setProfissionaisNecessarios(neededProfiles != null ? neededProfiles : new ArrayList<>());
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        e.setLocalizacao(gf.createPoint(new Coordinate(lng, lat)));
        return e;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public Integer getCriticalPointId() { return criticalPointId; }
    public void setCriticalPointId(Integer criticalPointId) { this.criticalPointId = criticalPointId; }

    public int getVictims() { return victims; }
    public void setVictims(int victims) { this.victims = victims; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<String> getNeededProfiles() { return neededProfiles; }
    public void setNeededProfiles(List<String> neededProfiles) { this.neededProfiles = neededProfiles; }
}
