package com.pird.pirdBackend.dto;

public class EspecialistaPutDTO {

    private String nome;
    private String telefone;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String cep;
    private Double latitude;
    private Double longitude;

    public EspecialistaPutDTO() {}

    public String getNome()      { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getTelefone()  { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getRua()       { return rua; }
    public void setRua(String rua) { this.rua = rua; }

    public String getNumero()    { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getBairro()    { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }

    public String getCidade()    { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getCep()       { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public Double getLatitude()  { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
