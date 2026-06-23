#pragma once
#include "sensor.h"
#include <string.h>
using namespace std;

class SensorMQ7 : public Sensor
{
  private:
    int pino;

  public:
    SensorMQ7(int pino) : Sensor("MQ7")
    {
      this->pino = pino;
    }

    float lerValor()
    {
      return analogRead(this->pino);
    }
};