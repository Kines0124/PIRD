package com.pird.pirdBackend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/proxy/foto")
public class R2ProxyController {

    @Value("${cloudflare.r2.public-url}")
    private String publicUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    public ResponseEntity<byte[]> proxy(@RequestParam String chave) {
        String url = publicUrl + "/" + chave;
        ResponseEntity<byte[]> r2Response = restTemplate.getForEntity(url, byte[].class);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(r2Response.getHeaders().getContentType());
        headers.set("Cache-Control", "max-age=3600");
        return new ResponseEntity<>(r2Response.getBody(), headers, HttpStatus.OK);
    }
}