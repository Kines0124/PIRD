package com.pird.pirdBackend.dto;

import java.util.List;

public class RotaGetDTO {

    private List<List<Double>> coordenadas;
    private double distanciaMetros;
    private double duracaoSegundos;
    private double origemLat;
    private double origemLng;
    private double destinoLat;
    private double destinoLng;

    public RotaGetDTO() {}

    public List<List<Double>> getCoordenadas()               { return coordenadas; }
    public void setCoordenadas(List<List<Double>> c)         { this.coordenadas = c; }

    public double getDistanciaMetros()                       { return distanciaMetros; }
    public void setDistanciaMetros(double v)                 { this.distanciaMetros = v; }

    public double getDuracaoSegundos()                       { return duracaoSegundos; }
    public void setDuracaoSegundos(double v)                 { this.duracaoSegundos = v; }

    public double getOrigemLat()                             { return origemLat; }
    public void setOrigemLat(double v)                       { this.origemLat = v; }

    public double getOrigemLng()                             { return origemLng; }
    public void setOrigemLng(double v)                       { this.origemLng = v; }

    public double getDestinoLat()                            { return destinoLat; }
    public void setDestinoLat(double v)                      { this.destinoLat = v; }

    public double getDestinoLng()                            { return destinoLng; }
    public void setDestinoLng(double v)                      { this.destinoLng = v; }
}
