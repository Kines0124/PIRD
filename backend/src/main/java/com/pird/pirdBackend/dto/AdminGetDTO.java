package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Administrador;

public class AdminGetDTO {

    private Integer id;
    private String  nome;
    private String  email;

    public AdminGetDTO() {}

    public AdminGetDTO(Administrador a) {
        this.id    = a.getId();
        this.nome  = a.getNome();
        this.email = a.getEmail();
    }

    public Integer getId()    { return id; }
    public String  getNome()  { return nome; }
    public String  getEmail() { return email; }
}
