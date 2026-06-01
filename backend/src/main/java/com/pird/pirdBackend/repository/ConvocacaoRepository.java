package com.pird.pirdBackend.repository;

import com.pird.pirdBackend.model.Convocacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConvocacaoRepository extends JpaRepository<Convocacao, Integer> {

    List<Convocacao> findByEvento_Id(Integer eventoId);

    List<Convocacao> findByEventoIdOrderByConvocadoEmDesc(Integer eventoId);

    List<Convocacao> findByEspecialistaIdOrderByConvocadoEmDesc(Integer especialistaId);

    List<Convocacao> findAllByOrderByConvocadoEmDesc();

    /** Conta convocações ativas (pendente/aceita) de uma profissão para um evento. */
    @Query("""
        SELECT COUNT(c) FROM Convocacao c
        WHERE c.evento.id = :eventoId
          AND c.especialista.profissao = :profissao
          AND c.status IN :statuses
        """)
    long countByEventoIdAndEspecialistaProfissaoAndStatusIn(
            @Param("eventoId")  Integer eventoId,
            @Param("profissao") String profissao,
            @Param("statuses")  List<String> statuses
    );

    boolean existsByEventoIdAndEspecialistaId(Integer eventoId, Integer especialistaId);
}
