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

    List<Especialista> findByDeletadoFalse();

    @Query("SELECT e.registro.id, e.id FROM Especialista e WHERE e.deletado = false AND e.registro IS NOT NULL")
    List<Object[]> findRegistroEspecialistaIdPairs();

    /**
     * Especialistas disponíveis por profissão e cidade (convocação automática).
     * Exclui deletados e quem já tem convocação ativa (pendente ou a_caminho).
     */
    @Query("""
        SELECT e FROM Especialista e
        WHERE LOWER(e.profissao) = LOWER(:profissao)
          AND LOWER(e.cidade)    = LOWER(:cidade)
          AND e.deletado = false
          AND NOT EXISTS (
              SELECT c FROM Convocacao c
              WHERE c.especialista = e
                AND c.status IN ('pendente', 'a_caminho', 'no_local')
          )
        """)
    List<Especialista> findDisponivelPorProfissaoECidade(
            @Param("profissao") String profissao,
            @Param("cidade")    String cidade
    );

    /**
     * Especialistas disponíveis por raio geográfico (mantido para uso futuro/manual).
     * Exclui deletados e quem já tem convocação ativa (pendente ou a_caminho).
     */
    @Query(value = """
        SELECT e.* FROM especialista e
        WHERE e.profissao = :profissao
          AND e.deletado  = false
          AND e.localizacao IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM convocacao c
              WHERE c.especialista_id = e.id
                AND c.status IN ('pendente', 'a_caminho', 'no_local')
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
            @Param("profissao")  String profissao,
            @Param("lat")        double lat,
            @Param("lng")        double lng,
            @Param("raioMetros") double raioMetros
    );
}
