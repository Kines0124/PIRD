package com.pird.pirdBackend.dto;

import java.util.List;

import com.pird.pirdBackend.model.Voluntario;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VoluntarioGetDTO {

    private Integer id;
    private String nome;
    private String email;
    private String especialidade;
    private double latitude;
    private double longitude;

    
    public VoluntarioGetDTO(){
    }

    public VoluntarioGetDTO( Voluntario voluntario){
        this.id = voluntario.getId();
        this.nome = voluntario.getNome();
        this.email = voluntario.getEmail();
        this.especialidade = voluntario.getEspecialidade();
        this.latitude = voluntario.getLocalizacao().getY();
        this.longitude = voluntario.getLocalizacao().getX();
    }

    public static List<VoluntarioGetDTO> convert(List<Voluntario> lista){
        return lista.stream().map(VoluntarioGetDTO::new).toList();
    }

}
