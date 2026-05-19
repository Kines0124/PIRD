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
import com.pird.pirdBackend.model.PontoColeta;
import org.springframework.security.core.userdetails.UserDetails;

@Service
public class TokenService {

    private static final String ISSUER = "pird-backend";

    @Value("${api.security.token.secret}")
    private String secret;

    public String gerarToken(UserDetails userDetails) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            int id = 0;
            String nome = "";
            if (userDetails instanceof Administrador admin) {
                id = admin.getId();
                nome = admin.getNome();
            } else if (userDetails instanceof PontoColeta pc) {
                id = pc.getId();
                nome = pc.getNomeLocal();
            }

            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(userDetails.getUsername())
                    .withClaim("id", id)
                    .withClaim("nome", nome)
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
