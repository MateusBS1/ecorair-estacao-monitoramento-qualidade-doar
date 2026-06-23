#pragma once

#include <DHT.h>

#define DHTTYPE DHT11

class SensorDHT {

private:

    int pino;
    DHT dht;

public:

    SensorDHT(int pino)
        : pino(pino),
          dht(pino, DHTTYPE)
    {
      float temp = dht.readTemperature();

      if (isnan(temp)) {
          Serial.println("Erro ao ler DHT11");
      }
    }

    void iniciar()
    {
        dht.begin();
    }

    float lerTemperatura()
    {
        return dht.readTemperature();
    }

    float lerUmidade()
    {
        return dht.readHumidity();
    }
};