package com.pird.pirdBackend.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pird.pirdBackend.repository.AdministradorRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filtro executado uma vez por requisição (OncePerRequestFilter).
 * Extrai o Bearer token do cabeçalho Authorization, valida e popula
 * o SecurityContext com a autenticação do administrador.
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AdministradorRepository administradorRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = recuperarToken(request);

        if (token != null) {
            String subject = tokenService.validarToken(token);

            if (!subject.isBlank()) {
                UserDetails administrador = administradorRepository.findByEmail(subject);

                if (administrador != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            administrador,
                            null,
                            administrador.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrai o token JWT do cabeçalho "Authorization: Bearer <token>".
     * Retorna null se o cabeçalho estiver ausente ou mal formatado.
     */
    private String recuperarToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
