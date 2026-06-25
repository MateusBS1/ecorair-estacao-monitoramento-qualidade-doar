#pragma once
#include <DHT.h>
#define DHTTYPE DHT11

class SensorDHT {
    private:
        int pino;
        DHT dht;

    public:
        SensorDHT(int pino) : dht(pino, DHTTYPE)
        {
            this->pino = pino;
        }

        void iniciar()
        {
            dht.begin();
            
            // Teste de leitura
            float temp = dht.readTemperature();
            if (isnan(temp)){
                Serial.println("Erro ao ler DHT11");
            }
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