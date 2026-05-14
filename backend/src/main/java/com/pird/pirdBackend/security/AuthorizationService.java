package com.pird.pirdBackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.pird.pirdBackend.repository.AdministradorRepository;

/**
 * Serviço responsável por carregar os dados do usuário (Administrador)
 * a partir do banco de dados durante a autenticação.
 * Integra-se ao mecanismo padrão do Spring Security.
 */
@Service
public class AuthorizationService implements UserDetailsService {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserDetails administrador = administradorRepository.findByEmail(email);

        if (administrador == null) {
            throw new UsernameNotFoundException("Administrador não encontrado com e-mail: " + email);
        }

        return administrador;
    }
}
