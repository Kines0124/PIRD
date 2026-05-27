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
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

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

                        // Preflight CORS
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()

                        // Autenticação pública
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/auth/login")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/auth/registrar")).permitAll()

                        // Cadastro de voluntário é público (auto-cadastro)
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/voluntarios")).permitAll()

                        // Cadastro de especialista é público; consulta individual permite polling de status
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/especialistas")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET,  "/especialistas/*")).permitAll()

                        // Rotas do painel do especialista (ROLE_ESPECIALISTA)
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET,   "/especialistas/aprovados/perfil")).hasRole("ESPECIALISTA")
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PUT,   "/especialistas/aprovados/*")).hasRole("ESPECIALISTA")
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET,   "/convocacoes/minhas")).hasRole("ESPECIALISTA")
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PATCH, "/convocacoes/*/aceitar")).hasRole("ESPECIALISTA")
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PATCH, "/convocacoes/*/recusar")).hasRole("ESPECIALISTA")

                        // Eventos ativos e pontos críticos (visíveis ao especialista)
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/eventos/ativos")).hasAnyRole("ESPECIALISTA", "ADMINISTRADOR")
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/pontos-criticos")).hasAnyRole("ESPECIALISTA", "ADMINISTRADOR")

                        // Swagger / OpenAPI
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/swagger-ui/**")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/swagger-ui.html")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/v3/api-docs/**")).permitAll()

                        // Tudo mais exige autenticação de administrador
                        .anyRequest().hasRole("ADMINISTRADOR")
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
