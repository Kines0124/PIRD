package com.pird.pirdBackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload recebido no endpoint POST /auth/login.
 */
@Getter
@Setter
@NoArgsConstructor
public class LoginRequestDTO {

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;
}
