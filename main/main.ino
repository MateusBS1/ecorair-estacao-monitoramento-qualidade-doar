#include "estacaoMeteorologica.h"
#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>

// MQ2 -> GPIO34
// MQ7 -> GPIO35
// DHT11 -> GPIO32
// LCD SDA -> GPIO26
// LCD SCL -> GPIO27

#define SDA_PIN 26
#define SCL_PIN 27

hd44780_I2Cexp lcd;

EstacaoMeteorologica estacao(
    34, // MQ2
    35, // MQ7
    32  // DHT11
);

unsigned long ultimaLeitura = 0;
unsigned long ultimaTrocaTela = 0;

int telaAtual = 0;

void setup()
{
    Serial.begin(115200);

    Wire.begin(SDA_PIN, SCL_PIN);

    int status = lcd.begin(16, 2);

    if(status)
    {
        Serial.print("Erro no LCD. Codigo: ");
        Serial.println(status);

        while(true);
    }

    lcd.backlight();

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Estacao");
    lcd.setCursor(0, 1);
    lcd.print("Iniciando...");

    estacao.iniciar();

    delay(2000);

    estacao.atualizar();

    lcd.clear();
}

void loop()
{
    unsigned long instanteAtual = millis();

    // Atualiza os sensores a cada 5 segundos
    if(instanteAtual - ultimaLeitura >= 5000)
    {
        ultimaLeitura = instanteAtual;

        estacao.atualizar();

        Serial.println();
        Serial.println("===== ECOAIR STATION =====");

        Serial.print("Temperatura: ");
        Serial.print(estacao.getTemperatura());
        Serial.println(" C");

        Serial.print("Umidade: ");
        Serial.print(estacao.getUmidade());
        Serial.println(" %");

        Serial.print("MQ2: ");
        Serial.println(estacao.getMQ2());

        Serial.print("MQ7: ");
        Serial.println(estacao.getMQ7());

        Serial.print("Qualidade do ar: ");
        Serial.println(estacao.getQualidadeGeral());

        Serial.println("==========================");
    }

    // Troca as telas do LCD a cada 2 segundos
    if(instanteAtual - ultimaTrocaTela >= 2000)
    {
        ultimaTrocaTela = instanteAtual;

        lcd.clear();

        switch(telaAtual)
        {
            case 0:

                lcd.setCursor(0, 0);
                lcd.print("EcoAir Station");

                lcd.setCursor(0, 1);
                lcd.print("Monitoramento");

                break;

            case 1:

                lcd.setCursor(0, 0);
                lcd.print("Temp:");
                lcd.print(estacao.getTemperatura(), 1);
                lcd.print("C");

                lcd.setCursor(0, 1);
                lcd.print("Umid:");
                lcd.print(estacao.getUmidade(), 1);
                lcd.print("%");

                break;

            case 2:

                lcd.setCursor(0, 0);
                lcd.print("Medindo");

                lcd.setCursor(0, 1);
                lcd.print("Qualidade...");

                break;

            case 3:

                lcd.setCursor(0, 0);
                lcd.print("Qualidade Ar");

                lcd.setCursor(0, 1);
                lcd.print(estacao.getQualidadeGeral());

                break;
        }

        telaAtual++;

        if(telaAtual > 3)
        {
            telaAtual = 0;
        }
    }
}