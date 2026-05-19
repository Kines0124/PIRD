package com.pird.pirdBackend.dto;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import com.pird.pirdBackend.model.Evento;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventoGetDTO {

    private Integer id;
    private String title;
    private String type;
    private String status;
    private String severity;
    private double lat;
    private double lng;
    private String city;
    private String date;
    private int victims;
    private String description;
    private Integer criticalPointId;
    private List<Object> photos = new ArrayList<>();
    private List<Integer> nearbyCollectionIds = new ArrayList<>();
    private List<Integer> volunteerIds = new ArrayList<>();

    public EventoGetDTO() {}

    public EventoGetDTO(Evento e) {
        this.id              = e.getId();
        this.title           = e.getTitulo();
        this.type            = e.getTipo();
        this.status          = e.getStatus();
        this.severity        = e.getSeveridade();
        this.lat             = e.getLocalizacao().getY();
        this.lng             = e.getLocalizacao().getX();
        this.city            = e.getCidade();
        this.date            = e.getDataInicio() != null
                                ? e.getDataInicio().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                : null;
        this.victims         = e.getVitimasEstimadas();
        this.description     = e.getDescricao();
        this.criticalPointId = e.getPontoCritico() != null ? e.getPontoCritico().getId() : null;
    }

    public static List<EventoGetDTO> convert(List<Evento> list) {
        return list.stream().map(EventoGetDTO::new).toList();
    }
}
