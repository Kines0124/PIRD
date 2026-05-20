package com.pird.pirdBackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuração central de segurança da aplicação.
 *
 * Estratégia:
 * - Stateless (sem sessão HTTP): toda autenticação é feita via JWT.
 * - CSRF desabilitado (adequado para APIs REST stateless).
 * - CORS configurado para aceitar origens do front-end.
 * - Rotas públicas: POST /auth/login, POST /voluntarios, Swagger UI.
 * - Todas as demais rotas exigem ROLE_ADMINISTRADOR.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // Autenticação pública
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/registrar").permitAll()

                        // Cadastro de voluntário é público (auto-cadastro)
                        .requestMatchers(HttpMethod.POST, "/voluntarios").permitAll()

                        // Cadastro de especialista é público; consulta individual permite polling de status
                        .requestMatchers(HttpMethod.POST, "/especialistas").permitAll()
                        .requestMatchers(HttpMethod.GET,  "/especialistas/*").permitAll()

                        // Swagger / OpenAPI — apenas em ambientes de desenvolvimento
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Tudo mais exige autenticação de administrador
                        .anyRequest().hasRole("ADMINISTRADOR")
                )
                // Nosso filtro JWT deve rodar ANTES do filtro padrão de usuário/senha
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Encoder de senha usando BCrypt (strength=12).
     * Utilizado no registro e na autenticação.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Expõe o AuthenticationManager para ser injetado no AuthController.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Configuração de CORS: permite o front-end (localhost:3000 e localhost:5173)
     * acessar a API com os métodos e cabeçalhos necessários.
     * Ajuste as origens conforme o ambiente de produção.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
