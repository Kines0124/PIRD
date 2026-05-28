package com.pird.pirdBackend.security;

import com.pird.pirdBackend.repository.AdministradorRepository;
import com.pird.pirdBackend.repository.EspecialistaRepository;
import com.pird.pirdBackend.repository.PontoColetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService implements UserDetailsService {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private PontoColetaRepository pontoColetaRepository;

    @Autowired
    private EspecialistaRepository especialistaRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails admin = administradorRepository.findByEmail(username);
        if (admin != null) return admin;

        UserDetails pontoColeta = pontoColetaRepository.findByCnpj(username);
        if (pontoColeta != null) return pontoColeta;

        UserDetails especialista = especialistaRepository.findByEmail(username);
        if (especialista != null) return especialista;

        throw new UsernameNotFoundException("Usuário não encontrado: " + username);
    }
}
