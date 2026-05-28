package com.pird.pirdBackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pird.pirdBackend.dto.LoginPontoColetaDTO;
import com.pird.pirdBackend.dto.LoginRequestDTO;
import com.pird.pirdBackend.dto.LoginResponseDTO;
import com.pird.pirdBackend.dto.RegistroAdminDTO;
import com.pird.pirdBackend.model.Administrador;
import com.pird.pirdBackend.model.Especialista;
import com.pird.pirdBackend.model.PontoColeta;
import com.pird.pirdBackend.repository.AdministradorRepository;
import com.pird.pirdBackend.security.TokenService;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * Controller responsável pelos endpoints públicos de autenticação.
 *
 * POST /auth/login    → autentica e retorna o token JWT
 * POST /auth/registrar → cria um novo administrador (proteger em produção)
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Endpoints de login e registro de administradores")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Autentica um administrador e retorna um token JWT.
     *
     * @param dto e-mail e senha do administrador
     * @return token JWT válido por 8 horas
     */
    @PostMapping("/login")
    @Operation(summary = "Autenticar administrador", description = "Retorna um token JWT para uso nas rotas protegidas")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequestDTO dto) {
        try {
            var credenciais = new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha());
            Authentication auth = authenticationManager.authenticate(credenciais);

            UserDetails user = (UserDetails) auth.getPrincipal();
            String token = tokenService.gerarToken(user);

            String nome;
            if (user instanceof Administrador admin) {
                nome = admin.getNome();
            } else if (user instanceof PontoColeta pc) {
                nome = pc.getNomeLocal();
            } else if (user instanceof Especialista esp) {
                nome = esp.getNome();
            } else {
                nome = user.getUsername();
            }

            return ResponseEntity.ok(new LoginResponseDTO(token, nome, user.getUsername()));

        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Conta desativada. Entre em contato com a Defesa Civil.");
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("E-mail ou senha inválidos.");
        }
    }

    @PostMapping("/login/ponto")
    @Operation(summary = "Autenticar ponto de coleta", description = "Retorna um token JWT via CNPJ e senha")
    public ResponseEntity<?> loginPonto(@RequestBody @Valid LoginPontoColetaDTO dto) {
        try {
            var credenciais = new UsernamePasswordAuthenticationToken(dto.getCnpj(), dto.getSenha());
            Authentication auth = authenticationManager.authenticate(credenciais);

            UserDetails user = (UserDetails) auth.getPrincipal();
            String token = tokenService.gerarToken(user);
            String nome = user instanceof PontoColeta pc ? pc.getNomeLocal() : user.getUsername();

            return ResponseEntity.ok(new LoginResponseDTO(token, nome, user.getUsername()));

        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Conta desativada ou aguardando validação da Defesa Civil.");
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("CNPJ ou senha inválidos.");
        }
    }

    @PostMapping("/registrar")
    @Operation(summary = "Registrar administrador", description = "Cria um novo administrador com senha hasheada (BCrypt)")
    public ResponseEntity<?> registrar(@RequestBody @Valid RegistroAdminDTO dto) {
        if (administradorRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("E-mail já cadastrado.");
        }

        Administrador administrador = new Administrador();
        administrador.setNome(dto.getNome());
        administrador.setEmail(dto.getEmail());
        administrador.setSenhaHash(passwordEncoder.encode(dto.getSenha()));

        administradorRepository.save(administrador);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Administrador registrado com sucesso.");
    }
}