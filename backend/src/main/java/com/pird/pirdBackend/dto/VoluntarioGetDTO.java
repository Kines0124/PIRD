package com.pird.pirdBackend.dto;

import java.time.format.DateTimeFormatter;
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
    private String name;
    private String specialty;
    private String status;
    private String region;
    private String registered;
    private boolean validado;

    public VoluntarioGetDTO() {}

    public VoluntarioGetDTO(Voluntario v) {
        this.id           = v.getId();
        this.nome         = v.getNome();
        this.email        = v.getEmail();
        this.especialidade = v.getEspecialidade();
        this.latitude     = v.getLocalizacao().getY();
        this.longitude    = v.getLocalizacao().getX();
        this.name         = v.getNome();
        this.specialty    = v.getEspecialidade();
        this.validado     = v.isValidado();
        this.status       = v.isValidado() ? "aprovado" : "pendente";
        this.region       = "";
        this.registered   = v.getCriadoEm() != null
                            ? v.getCriadoEm().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                            : "";
    }

    public static List<VoluntarioGetDTO> convert(List<Voluntario> lista) {
        return lista.stream().map(VoluntarioGetDTO::new).toList();
    }
}
