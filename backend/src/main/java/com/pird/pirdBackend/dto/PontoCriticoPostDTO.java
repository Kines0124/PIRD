package com.pird.pirdBackend.dto;

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
    private String address;
    private String city;
    private Double lat;
    private Double lng;

    public PontoCriticoPostDTO() {}

    public PontoCritico convert() {
        PontoCritico p = new PontoCritico();
        p.setNomeLocal(name);
        p.setTipoRisco(type);
        p.setNivelRisco(risk);
        p.setDescricao(description);
        p.setEndereco(address);
        p.setCidade(city);
        p.setLat(lat);
        p.setLng(lng);
        return p;
    }
}
