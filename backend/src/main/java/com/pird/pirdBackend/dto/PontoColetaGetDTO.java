package com.pird.pirdBackend.dto;

import java.util.List;

import com.pird.pirdBackend.model.PontoColeta;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PontoColetaGetDTO {

    private Integer id;
    private String name;
    private String cnpj;
    private String address;
    private String city;
    private double lat;
    private double lng;
    private String status;
    private String email;
    private String phone;
    private String type;

    public PontoColetaGetDTO() {}

    public PontoColetaGetDTO(PontoColeta p) {
        this.id      = p.getId();
        this.name    = p.getNomeLocal();
        this.cnpj    = p.getCnpj();
        this.address = p.getEndereco();
        this.city    = "";
        this.lat     = p.getLocalizacao().getY();
        this.lng     = p.getLocalizacao().getX();
        this.status  = p.isValidado() ? "validado" : "pendente";
        this.email   = p.getEmail();
        this.phone   = p.getTelefone();
        this.type    = p.isTipoPonto() ? "Fixo" : "Temporário";
    }

    public static List<PontoColetaGetDTO> convert(List<PontoColeta> list) {
        return list.stream().map(PontoColetaGetDTO::new).toList();
    }
}
