#pragma once 
#include <string.h>
#include "sensor.h"
using namespace std;

class SensorMQ2 : public Sensor
{
  private:
    int pino;

  public:
    SensorMQ2(int pino) : Sensor("MQ2")
    {
      this->pino = pino;
    }

    SensorMQ2() : Sensor("MQ2")
    {
      this->pino = 34;
    }

    float lerValor()
    {
      return analogRead(this->pino);
    }
};