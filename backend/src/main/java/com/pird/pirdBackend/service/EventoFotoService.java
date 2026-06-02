package com.pird.pirdBackend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.pird.pirdBackend.dto.EventoFotoGetDTO;
import com.pird.pirdBackend.model.Evento;
import com.pird.pirdBackend.model.EventoFoto;
import com.pird.pirdBackend.repository.EventoFotoRepository;
import com.pird.pirdBackend.repository.EventoRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EventoFotoService {

    @Autowired
    private EventoFotoRepository eventoFotoRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private R2StorageService r2StorageService;

    @Transactional
    public EventoFotoGetDTO uploadFoto(Integer eventoId, MultipartFile arquivo) {
        Evento evento = eventoRepository.findById(eventoId)
            .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado."));

        String url = r2StorageService.upload("eventos/" + eventoId, arquivo);

        EventoFoto foto = new EventoFoto();
        foto.setEvento(evento);
        foto.setFotoUrl(url);
        foto.setNomeArquivo(arquivo.getOriginalFilename());

        eventoFotoRepository.save(foto);
        return new EventoFotoGetDTO(foto);
    }

    @Transactional(readOnly = true)
    public List<EventoFotoGetDTO> listarFotos(Integer eventoId) {
        if (!eventoRepository.existsById(eventoId)) {
            throw new EntityNotFoundException("Evento não encontrado.");
        }
        return eventoFotoRepository.findByEventoIdOrderByUploadedAtAsc(eventoId)
            .stream()
            .map(EventoFotoGetDTO::new)
            .toList();
    }

    @Transactional
    public void removerFoto(Integer eventoId, Integer fotoId) {
        EventoFoto foto = eventoFotoRepository.findById(fotoId)
            .orElseThrow(() -> new EntityNotFoundException("Foto não encontrada."));

        if (!foto.getEvento().getId().equals(eventoId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Foto não pertence ao evento informado.");
        }

        r2StorageService.deletar(foto.getFotoUrl());
        eventoFotoRepository.delete(foto);
    }
}
