package com.pird.pirdBackend.dto;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import com.pird.pirdBackend.model.Evento;

public class EventoGetDTO {

    private Integer id;
    private String title;
    private String type;
    private String status;
    private String severity;
    private double lat;
    private double lng;
    private String city;
    private String address;
    private String date;
    private int victims;
    private String description;
    private Integer criticalPointId;
    private List<String> neededProfiles = new ArrayList<>();
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
        this.address         = e.getEndereco();
        this.date            = e.getDataInicio() != null
                                ? e.getDataInicio().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                : null;
        this.victims         = e.getVitimasEstimadas();
        this.description     = e.getDescricao();
        this.criticalPointId = e.getPontoCritico() != null ? e.getPontoCritico().getId() : null;
        this.neededProfiles  = e.getProfissionaisNecessarios() != null
                                ? e.getProfissionaisNecessarios()
                                : new ArrayList<>();
    }

    public static List<EventoGetDTO> convert(List<Evento> list) {
        return list.stream().map(EventoGetDTO::new).toList();
    }

    public Integer getId() { return id; }
    public String getTitle() { return title; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getSeverity() { return severity; }
    public double getLat() { return lat; }
    public double getLng() { return lng; }
    public String getCity() { return city; }
    public String getAddress() { return address; }
    public String getDate() { return date; }
    public int getVictims() { return victims; }
    public String getDescription() { return description; }
    public Integer getCriticalPointId() { return criticalPointId; }
    public List<String> getNeededProfiles() { return neededProfiles; }
    public List<Object> getPhotos() { return photos; }
    public List<Integer> getNearbyCollectionIds() { return nearbyCollectionIds; }
    public List<Integer> getVolunteerIds() { return volunteerIds; }
}
