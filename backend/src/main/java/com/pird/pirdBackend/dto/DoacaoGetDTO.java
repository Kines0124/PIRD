package com.pird.pirdBackend.dto;

import com.pird.pirdBackend.model.Doacao;

import java.time.LocalDateTime;
import java.util.List;

public class DoacaoGetDTO {

    private Integer id;
    private Integer demandaId;
    private String categoriaItem;
    private String descricaoItem;
    private String nomeDoador;
    private String contatoDoador;
    private int quantidade;
    private String status;
    private LocalDateTime criadoEm;

    public DoacaoGetDTO() {}

    public DoacaoGetDTO(Doacao d) {
        this.id            = d.getId();
        this.demandaId     = d.getDemanda() != null ? d.getDemanda().getId() : null;
        this.categoriaItem = d.getDemanda() != null ? d.getDemanda().getCategoria() : null;
        this.descricaoItem = d.getDescricaoItem() != null
            ? d.getDescricaoItem()
            : (d.getDemanda() != null ? d.getDemanda().getDescricaoItem() : null);
        this.nomeDoador    = d.getNomeDoador();
        this.contatoDoador = d.getContatoDoador();
        this.quantidade    = d.getQuantidade();
        this.status        = d.getStatus();
        this.criadoEm      = d.getCriadoEm();
    }

    public static List<DoacaoGetDTO> convert(List<Doacao> list) {
        return list.stream().map(DoacaoGetDTO::new).toList();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getDemandaId() { return demandaId; }
    public void setDemandaId(Integer demandaId) { this.demandaId = demandaId; }

    public String getCategoriaItem() { return categoriaItem; }
    public void setCategoriaItem(String categoriaItem) { this.categoriaItem = categoriaItem; }

    public String getDescricaoItem() { return descricaoItem; }
    public void setDescricaoItem(String descricaoItem) { this.descricaoItem = descricaoItem; }

    public String getNomeDoador() { return nomeDoador; }
    public void setNomeDoador(String nomeDoador) { this.nomeDoador = nomeDoador; }

    public String getContatoDoador() { return contatoDoador; }
    public void setContatoDoador(String contatoDoador) { this.contatoDoador = contatoDoador; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
