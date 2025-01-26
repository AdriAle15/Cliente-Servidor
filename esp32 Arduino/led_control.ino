#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

const char* ssid = "Yolymell";
const char* password = "0802785477";

// Definir pines para los LEDs
const int LED_PIN_1 = 12;
const int LED_PIN_2 = 14;
const int LED_PIN_3 = 27;

// Crear servidor WebSocket en el puerto 81
WebSocketsServer webSocket = WebSocketsServer(81);

// Función para manejar eventos WebSocket
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Desconectado!\n", num);
      break;
    
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Conectado desde %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        
        // Enviar estado actual de los LEDs
        sendLedStates();
      }
      break;
    
    case WStype_TEXT:
      {
        // Convertir payload a String
        String message = String((char*)payload);
        Serial.printf("[%u] Mensaje recibido: %s\n", num, message.c_str());

        // Parsear JSON
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, message);

        if (error) {
          Serial.println("Error al parsear JSON");
          return;
        }

        // Verificar si es un comando para LED
        if (doc["type"] == "led") {
          String variable = doc["variable"].as<String>();
          bool state = doc["state"] == "on";
          
          // Controlar LED según la variable
          if (variable == "led1") {
            digitalWrite(LED_PIN_1, state ? HIGH : LOW);
          } else if (variable == "led2") {
            digitalWrite(LED_PIN_2, state ? HIGH : LOW);
          } else if (variable == "led3") {
            digitalWrite(LED_PIN_3, state ? HIGH : LOW);
          }

          // Enviar confirmación del estado
          sendLedState(variable, state);
        }
      }
      break;
  }
}

// Función para enviar el estado de un LED específico
void sendLedState(String variable, bool state) {
  StaticJsonDocument<200> doc;
  doc["type"] = "ledState";
  doc["variable"] = variable;
  doc["state"] = state ? "on" : "off";

  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.broadcastTXT(jsonString);
}

// Función para enviar estados de todos los LEDs
void sendLedStates() {
  sendLedState("led1", digitalRead(LED_PIN_1) == HIGH);
  sendLedState("led2", digitalRead(LED_PIN_2) == HIGH);
  sendLedState("led3", digitalRead(LED_PIN_3) == HIGH);
}

void setup() {
  Serial.begin(115200);

  // Configurar pines de LED como salida
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(LED_PIN_3, OUTPUT);

  // Iniciar todos los LEDs apagados
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  digitalWrite(LED_PIN_3, LOW);

  // Conectar a WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado");
  Serial.println("Dirección IP: ");
  Serial.println(WiFi.localIP());

  // Iniciar servidor WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("Servidor WebSocket iniciado");
}

void loop() {
  webSocket.loop();
} 