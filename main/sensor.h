#pragma once
#define SENSOR_H
#include <string.h>
using namespace std;

class Sensor {
protected:
    String nome;

public:
    Sensor(String nomeSensor)
    {
      this->nome = nomeSensor;
    };

    float lerValor()
    {
      return 0;
    }

    const String getNome()
    {
      return this->nome;
    }
};