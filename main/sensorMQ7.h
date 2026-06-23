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
      if(pino == 35)
      {
        this->pino = pino;
      }
      else
      {
        this->pino = 35;
      }
    }

    SensorMQ7() : Sensor("MQ7")
    {
      this->pino = 35;
    }

    float lerValor()
    {
      return analogRead(this->pino);
    }
};