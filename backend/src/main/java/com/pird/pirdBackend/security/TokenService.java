package com.pird.pirdBackend.security;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.pird.pirdBackend.model.Administrador;

@Service
public class TokenService {

    private static final String ISSUER = "pird-backend";

    @Value("${api.security.token.secret}")
    private String secret;

    /**
     * Gera um token JWT assinado com HMAC256 para o administrador autenticado.
     * O token expira em 8 horas a partir da geração.
     */
    public String gerarToken(Administrador administrador) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(administrador.getEmail())
                    .withClaim("id", administrador.getId())
                    .withClaim("nome", administrador.getNome())
                    .withExpiresAt(gerarDataExpiracao())
                    .sign(algorithm);

        } catch (JWTCreationException e) {
            throw new RuntimeException("Erro ao gerar token JWT", e);
        }
    }

    /**
     * Valida o token e retorna o subject (e-mail) caso seja válido.
     * Retorna uma String vazia se o token for inválido ou expirado.
     */
    public String validarToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            return JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();

        } catch (JWTVerificationException e) {
            return "";
        }
    }

    private Instant gerarDataExpiracao() {
        return LocalDateTime.now()
                .plusHours(8)
                .toInstant(ZoneOffset.of("-03:00"));
    }
}
