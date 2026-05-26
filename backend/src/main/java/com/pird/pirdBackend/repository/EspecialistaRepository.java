package com.pird.pirdBackend.repository;

import com.pird.pirdBackend.model.Especialista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EspecialistaRepository extends JpaRepository<Especialista, Integer> {

    Especialista findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Retorna especialistas disponíveis (sem convocação ativa) dentro do raio,
     * filtrados por profissão e ordenados por distância crescente.
     *
     * Exclui especialistas com convocação no status 'pendente' ou 'aceita'
     * em qualquer evento — eles estão indisponíveis.
     */
    @Query(value = """
        SELECT e.* FROM especialista e
        WHERE e.profissao = :profissao
          AND e.localizacao IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM convocacao c
              WHERE c.especialista_id = e.id
                AND c.status IN ('pendente', 'aceita')
          )
          AND ST_DWithin(
              e.localizacao,
              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
              :raioMetros
          )
        ORDER BY ST_Distance(
            e.localizacao,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )
        """, nativeQuery = true)
    List<Especialista> findDisponiveisDentroDoRaio(
            @Param("profissao")   String profissao,
            @Param("lat")         double lat,
            @Param("lng")         double lng,
            @Param("raioMetros")  double raioMetros
    );
}
