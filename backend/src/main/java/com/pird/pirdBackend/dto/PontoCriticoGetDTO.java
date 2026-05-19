package com.pird.pirdBackend.dto;

import java.util.List;

import com.pird.pirdBackend.model.PontoCritico;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PontoCriticoGetDTO {

    private Integer id;
    private String name;
    private String type;
    private String risk;
    private double lat;
    private double lng;
    private String description;

    public PontoCriticoGetDTO() {}

    public PontoCriticoGetDTO(PontoCritico p) {
        this.id          = p.getId();
        this.name        = p.getNomeLocal();
        this.type        = p.getTipoRisco();
        this.risk        = p.getNivelRisco();
        this.lat         = p.getLocalizacao().getY();
        this.lng         = p.getLocalizacao().getX();
        this.description = p.getDescricao();
    }

    public static List<PontoCriticoGetDTO> convert(List<PontoCritico> list) {
        return list.stream().map(PontoCriticoGetDTO::new).toList();
    }
}
