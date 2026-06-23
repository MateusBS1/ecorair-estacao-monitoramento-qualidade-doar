#pragma once
#define ESTACAOMETEOROLOGICA_H

#include "sensorMQ2.h"
#include "sensorMQ7.h"
#include "DHT11.h"

class EstacaoMeteorologica {

  private:

      SensorMQ2 mq2;
      SensorMQ7 mq7;
      SensorDHT dht;

      float valorMQ2;
      float valorMQ7;
      float temperatura;
      float umidade;

      // Histórico das leituras
      float historicoMQ2[20];
      float historicoMQ7[20];

      int indice;

  public:

      // Construtor
      EstacaoMeteorologica(int pinoMQ2, int pinoMQ7, int pinoDHT) : 
            mq2(pinoMQ2),
            mq7(pinoMQ7),
            dht(pinoDHT)
      {
          this->indice = 0;

          this->valorMQ2 = 0;
          this->valorMQ7 = 0;
          this->temperatura = 0;
          this->umidade = 0;

          // Inicializa os arrays
          for(int i = 0; i < 20; i++) {

              historicoMQ2[i] = 0;
              historicoMQ7[i] = 0;
          }
      }

      // Inicializa sensores
      void iniciar() {

          dht.iniciar();
      }

      // Atualiza todas as leituras
      void atualizar() {

          this->valorMQ2 = mq2.lerValor();
          this->valorMQ7 = mq7.lerValor();

          this->temperatura = dht.lerTemperatura();
          this->umidade = dht.lerUmidade();

          // Salva no histórico
          this->historicoMQ2[indice] = valorMQ2;
          this->  historicoMQ7[indice] = valorMQ7;

          this->indice++;

          if(this->indice >= 20) {
              this->indice = 0;
          }
      }

      // Bubble Sort
      void bubbleSort(float vetor[], int tamanho) {

          for(int i = 0; i < tamanho - 1; i++) {

              for(int j = 0; j < tamanho - 1 - i; j++) {

                  if(vetor[j] > vetor[j + 1]) {

                      float aux = vetor[j];
                      vetor[j] = vetor[j + 1];
                      vetor[j + 1] = aux;
                  }
              }
          }
      }

      // Retorna a maior leitura do MQ2
      float getMaiorMQ2() {

          float copia[20];

          for(int i = 0; i < 20; i++) {
              copia[i] = historicoMQ2[i];
          }

          bubbleSort(copia, 20);

          return copia[19];
      }

      // Retorna a maior leitura do MQ7
      float getMaiorMQ7() {

          float copia[20];

          for(int i = 0; i < 20; i++) {
              copia[i] = historicoMQ7[i];
          }

          bubbleSort(copia, 20);

          return copia[19];
      }

      // Getters
      float getMQ2() {
          return valorMQ2;
      }

      float getMQ7() {
          return valorMQ7;
      }

      float getTemperatura() {
          return temperatura;
      }

      float getUmidade() {
          return umidade;
      }

      String classificarAr(float valor) {
        if(valor <= 1000) {
            return "Boa";
        }
        else if(valor <= 2500) {
            return "Moderada";
        }
        else if(valor <= 3500) {
            return "Ruim";
        }
        else {
            return "Critica";
        }
      }
    
    String getQualidadeGeral()
    {
        float maiorValor;

        if(this->valorMQ2 > this->valorMQ7)
        {
            maiorValor = this->valorMQ2;
        }

        else
        {
            maiorValor = this->valorMQ7;
        }

        return this->classificarAr(maiorValor);
    }
};