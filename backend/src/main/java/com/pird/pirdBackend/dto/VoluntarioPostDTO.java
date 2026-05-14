package com.pird.pirdBackend.dto;

import org.hibernate.validator.constraints.Length;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;

import com.pird.pirdBackend.model.Voluntario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

@Getter 
@Setter
public class VoluntarioPostDTO {

    @NotBlank
    @Length(max = 100)
    private String nome;

    @NotBlank
    @Length(max = 100)
    private String email;

    @NotBlank
    private String senhaHash;

    @NotBlank
    @Length(max = 100)
    private String especialidade;

    @NotNull
    private double latitude;

    @NotNull
    private double longitude;


    public Voluntario convert(){
        Voluntario voluntario = new Voluntario();
        GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);
        Point ponto = gf.createPoint(new Coordinate(this.longitude, this.latitude));

        voluntario.setNome(this.nome);
        voluntario.setEmail(this.email);
        voluntario.setSenhaHash(this.senhaHash);
        voluntario.setEspecialidade(this.especialidade);
        voluntario.setLocalizacao(ponto);

        return voluntario;
    }

}
