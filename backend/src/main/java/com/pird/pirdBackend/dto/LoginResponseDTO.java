package com.pird.pirdBackend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload retornado após autenticação bem-sucedida.
 * O campo "token" deve ser enviado no cabeçalho
 * Authorization: Bearer <token> nas requisições subsequentes.
 */
@Getter
@Setter
@NoArgsConstructor
public class LoginResponseDTO {

    private String token;
    private String tipo;
    private String nome;
    private String email;

    public LoginResponseDTO(String token, String nome, String email) {
        this.token = token;
        this.tipo = "Bearer";
        this.nome = nome;
        this.email = email;
    }
}
