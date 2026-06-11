package com.pird.pirdBackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pird.pirdBackend.dto.RotaGetDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MapboxService {

    @Value("${mapbox.token:}")
    private String mapboxToken;

    @Autowired
    private ObjectMapper objectMapper;

    private final RestTemplate rest = new RestTemplate();

    /**
     * Chama a Directions API do Mapbox e retorna a rota simplificada.
     * Coordenadas no padrão WGS-84 (latitude, longitude).
     */
    @SuppressWarnings("unchecked")
    public RotaGetDTO obterRota(double origemLat, double origemLng,
                                double destinoLat, double destinoLng) {
        if (mapboxToken == null || mapboxToken.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Token Mapbox não configurado no servidor (variável MAPBOX_TOKEN).");
        }

        // Mapbox espera coordenadas no formato: {lng},{lat}
        String url = String.format(Locale.US,
            "https://api.mapbox.com/directions/v5/mapbox/driving/%.6f,%.6f;%.6f,%.6f"
            + "?geometries=geojson&overview=full&steps=false&access_token=%s",
            origemLng, origemLat,
            destinoLng, destinoLat,
            mapboxToken);

        try {
            String json = rest.getForObject(url, String.class);
            Map<String, Object> body = objectMapper.readValue(json,
                new TypeReference<Map<String, Object>>() {});

            List<Map<String, Object>> routes =
                (List<Map<String, Object>>) body.get("routes");
            if (routes == null || routes.isEmpty()) {
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Nenhuma rota encontrada pelo Mapbox.");
            }

            Map<String, Object> route    = routes.get(0);
            Map<String, Object> geometry = (Map<String, Object>) route.get("geometry");
            List<List<Double>> coords    = (List<List<Double>>) geometry.get("coordinates");
            double distance = ((Number) route.get("distance")).doubleValue();
            double duration = ((Number) route.get("duration")).doubleValue();

            RotaGetDTO dto = new RotaGetDTO();
            dto.setCoordenadas(coords);
            dto.setDistanciaMetros(distance);
            dto.setDuracaoSegundos(duration);
            dto.setOrigemLat(origemLat);
            dto.setOrigemLng(origemLng);
            dto.setDestinoLat(destinoLat);
            dto.setDestinoLng(destinoLng);
            return dto;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY, "Erro ao consultar API Mapbox: " + e.getMessage());
        }
    }
}
