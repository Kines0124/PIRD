package com.pird.pirdBackend.service;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class R2StorageService {

    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key-id}")
    private String accessKeyId;

    @Value("${cloudflare.r2.secret-access-key}")
    private String secretAccessKey;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Value("${cloudflare.r2.public-url}")
    private String publicUrl;

    private S3Client s3Client;

    @PostConstruct
    private void init() {
        s3Client = S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of("auto"))
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                )
            )
            .forcePathStyle(true)
            .build();
    }

    /**
     * Faz upload de um arquivo para o R2 dentro da pasta indicada.
     * @param pasta  prefixo do path no bucket, ex: "eventos/42"
     * @param arquivo arquivo recebido via multipart
     * @return URL pública completa do objeto armazenado
     */
    public String upload(String pasta, MultipartFile arquivo) {
        String chave = pasta + "/" + UUID.randomUUID() + obterExtensao(arquivo.getOriginalFilename());

        try {
            PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(chave)
                .contentType(arquivo.getContentType())
                .build();

            s3Client.putObject(req, RequestBody.fromInputStream(arquivo.getInputStream(), arquivo.getSize()));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao enviar arquivo ao R2.");
        }

        return publicUrl + "/" + chave;
    }

    /**
     * Remove um objeto do R2 a partir de sua URL pública.
     * @param fotoUrl URL pública retornada no momento do upload
     */
    public void deletar(String fotoUrl) {
        String chave = fotoUrl.replace(publicUrl + "/", "");

        DeleteObjectRequest req = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(chave)
            .build();

        s3Client.deleteObject(req);
    }

    private String obterExtensao(String nomeArquivo) {
        if (nomeArquivo == null || !nomeArquivo.contains(".")) return "";
        return nomeArquivo.substring(nomeArquivo.lastIndexOf("."));
    }
}
