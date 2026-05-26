package com.pird.pirdBackend.config;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Regras estáticas de elegibilidade, prioridade e limites de convocação.
 *
 * Tiers de prioridade por tipo de evento (P1 = maior prioridade):
 *   P1 — profissões essenciais para o tipo; convocadas primeiro
 *   P2 — suporte especializado
 *   P3 — apoio; convocadas apenas se ainda houver vagas
 *
 * Mínimo por tier por criticidade (MINIMO_POR_TIER[sevIdx][tierIdx]):
 *   sevIdx: 0=moderado/medio  1=alto/grave  2=critico
 *   tierIdx: 0=P1  1=P2  2=P3
 *
 * Teto absoluto de convocações por evento (TETO[severidade]):
 *   moderado→5  alto/grave→8  critico→10
 */
public final class ConvocacaoConfig {

    private ConvocacaoConfig() {}

    // ── Elegibilidade: profissão → tipos de evento permitidos ────────────────

    public static final Map<String, Set<String>> ELEGIBILIDADE = new LinkedHashMap<>();

    static {
        Set<String> TODOS = Set.of(
            "enchente", "deslizamento", "alagamento", "incendio",
            "desabamento", "acidente_transito", "intoxicacao", "outro"
        );

        for (String prof : List.of(
            "Médico Clínico Geral", "Médico Emergencista", "Médico Intensivista (UTI)",
            "Enfermeiro(a)", "Técnico de Enfermagem", "Policial/Segurança Pública"
        )) ELEGIBILIDADE.put(prof, TODOS);

        for (String prof : List.of(
            "Médico Cardiologista", "Médico Neurologista", "Médico Ortopedista"
        )) ELEGIBILIDADE.put(prof, Set.of(
            "intoxicacao", "acidente_transito", "desabamento", "deslizamento", "outro"
        ));

        for (String prof : List.of(
            "Bombeiro Civil", "Bombeiro Militar", "Brigadista"
        )) ELEGIBILIDADE.put(prof, Set.of(
            "incendio", "desabamento", "deslizamento", "acidente_transito", "enchente", "alagamento"
        ));

        for (String prof : List.of(
            "Técnico em Resgate", "Paramédico / SAMU", "Socorrista"
        )) ELEGIBILIDADE.put(prof, Set.of(
            "acidente_transito", "desabamento", "deslizamento", "enchente", "alagamento", "intoxicacao"
        ));

        for (String prof : List.of(
            "Engenheiro de Segurança", "Técnico Defesa Civil"
        )) ELEGIBILIDADE.put(prof, Set.of(
            "desabamento", "deslizamento", "enchente", "alagamento", "incendio"
        ));

        ELEGIBILIDADE.put("Guia de Cão de Resgate",
            Set.of("desabamento", "deslizamento"));

        ELEGIBILIDADE.put("Mergulhador de Resgate",
            Set.of("enchente", "alagamento"));

        // Psicólogo e Assistente Social: máx 1 por evento, somente em tipos relevantes
        ELEGIBILIDADE.put("Psicólogo",
            Set.of("incendio", "desabamento", "deslizamento", "acidente_transito", "outro"));

        ELEGIBILIDADE.put("Assistente Social",
            Set.of("desabamento", "deslizamento", "enchente", "alagamento", "outro"));
    }

    // ── Prioridade: tipo de evento → [P1, P2, P3] (listas de profissões) ─────

    public static final Map<String, List<List<String>>> PRIORIDADE = new LinkedHashMap<>();

    static {
        PRIORIDADE.put("incendio", List.of(
            List.of("Bombeiro Civil", "Bombeiro Militar", "Brigadista"),
            List.of("Engenheiro de Segurança", "Paramédico / SAMU", "Socorrista"),
            List.of("Médico Emergencista", "Enfermeiro(a)", "Psicólogo")
        ));

        PRIORIDADE.put("enchente", List.of(
            List.of("Mergulhador de Resgate", "Técnico em Resgate"),
            List.of("Bombeiro Civil", "Bombeiro Militar", "Paramédico / SAMU", "Socorrista"),
            List.of("Médico Emergencista", "Engenheiro de Segurança", "Assistente Social")
        ));

        PRIORIDADE.put("alagamento", List.of(
            List.of("Mergulhador de Resgate", "Técnico em Resgate"),
            List.of("Bombeiro Civil", "Bombeiro Militar", "Paramédico / SAMU", "Socorrista"),
            List.of("Médico Emergencista", "Engenheiro de Segurança", "Assistente Social")
        ));

        PRIORIDADE.put("acidente_transito", List.of(
            List.of("Paramédico / SAMU", "Socorrista"),
            List.of("Médico Emergencista", "Bombeiro Civil", "Bombeiro Militar"),
            List.of("Enfermeiro(a)", "Técnico de Enfermagem", "Psicólogo")
        ));

        PRIORIDADE.put("desabamento", List.of(
            List.of("Guia de Cão de Resgate", "Técnico em Resgate", "Bombeiro Civil", "Bombeiro Militar"),
            List.of("Engenheiro de Segurança", "Técnico Defesa Civil"),
            List.of("Médico Emergencista", "Enfermeiro(a)", "Psicólogo", "Assistente Social")
        ));

        PRIORIDADE.put("deslizamento", List.of(
            List.of("Guia de Cão de Resgate", "Técnico em Resgate", "Bombeiro Civil", "Bombeiro Militar"),
            List.of("Engenheiro de Segurança", "Técnico Defesa Civil"),
            List.of("Médico Emergencista", "Enfermeiro(a)", "Psicólogo", "Assistente Social")
        ));

        PRIORIDADE.put("intoxicacao", List.of(
            List.of("Médico Clínico Geral", "Médico Emergencista"),
            List.of("Enfermeiro(a)", "Técnico de Enfermagem", "Paramédico / SAMU"),
            List.of()
        ));

        PRIORIDADE.put("outro", List.of(
            List.of("Médico Clínico Geral", "Médico Emergencista"),
            List.of("Enfermeiro(a)", "Paramédico / SAMU"),
            List.of("Psicólogo", "Assistente Social")
        ));
    }

    // ── Teto absoluto de convocações por severidade ──────────────────────────

    public static final Map<String, Integer> TETO = Map.of(
        "moderado", 5,
        "medio",    5,
        "alto",     8,
        "grave",    8,
        "critico",  10
    );

    // ── Índice de severidade (para MINIMO_POR_TIER) ──────────────────────────

    public static final Map<String, Integer> SEV_INDEX = Map.of(
        "moderado", 0,
        "medio",    0,
        "alto",     1,
        "grave",    1,
        "critico",  2
    );

    /**
     * Mínimo de convocações por tier por índice de criticidade.
     * [sevIdx][tierIdx] — sevIdx: 0=moderado, 1=alto, 2=critico
     *                   — tierIdx: 0=P1, 1=P2, 2=P3
     */
    public static final int[][] MINIMO_POR_TIER = {
        {1, 0, 0},  // moderado
        {2, 1, 0},  // alto
        {3, 2, 1},  // critico
    };

    // ── Profissões com limite de 1 por evento ────────────────────────────────

    public static final Set<String> LIMITE_UM_POR_EVENTO = Set.of(
        "Psicólogo", "Assistente Social"
    );

    // ── Raio máximo de busca (km) ────────────────────────────────────────────

    public static final double RAIO_INICIAL_KM = 1.0;
    public static final double RAIO_MAXIMO_KM  = 32.0;
}
