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

// Variables para almacenar estados de LEDs
bool ledState1 = false;
bool ledState2 = false;
bool ledState3 = false;

void handleLedCommand(String variable, bool state) {
  int pin = -1;
  bool* ledState = nullptr;
  
  if (variable == "led1") {
    pin = LED_PIN_1;
    ledState = &ledState1;
  } else if (variable == "led2") {
    pin = LED_PIN_2;
    ledState = &ledState2;
  } else if (variable == "led3") {
    pin = LED_PIN_3;
    ledState = &ledState3;
  }

  if (pin != -1 && ledState != nullptr) {
    *ledState = state;
    digitalWrite(pin, state ? HIGH : LOW);
    Serial.printf("LED %s cambiado a %s\n", variable.c_str(), state ? "ON" : "OFF");
  }
}

void sendLedState(uint8_t num, String variable, bool state) {
  StaticJsonDocument<200> doc;
  doc["type"] = "ledState";
  doc["variable"] = variable;
  doc["state"] = state ? "on" : "off";

  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(num, jsonString);
  Serial.printf("Enviando estado: %s\n", jsonString.c_str());
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Cliente desconectado\n", num);
      break;
    
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Cliente conectado - IP: %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        
        // Enviar estados actuales con delay para asegurar que el cliente esté listo
        delay(100);
        Serial.println("Enviando estados iniciales...");
        sendLedState(num, "led1", ledState1);
        sendLedState(num, "led2", ledState2);
        sendLedState(num, "led3", ledState3);
      }
      break;
    
    case WStype_TEXT:
      {
        String message = String((char*)payload);
        Serial.printf("[%u] Mensaje recibido: %s\n", num, message.c_str());

        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, message);

        if (error) {
          Serial.printf("Error al parsear JSON: %s\n", error.c_str());
          return;
        }

        if (doc["type"] == "led") {
          String variable = doc["variable"].as<String>();
          bool state = doc["state"] == "on";
          
          Serial.printf("Comando LED recibido - Variable: %s, Estado: %s\n", 
            variable.c_str(), state ? "ON" : "OFF");
          
          handleLedCommand(variable, state);
          
          // Enviar confirmación a todos los clientes
          webSocket.broadcastTXT(message.c_str());
        }
      }
      break;

    case WStype_ERROR:
      Serial.printf("[%u] Error en WebSocket\n", num);
      break;

    case WStype_PING:
      Serial.printf("[%u] Ping recibido\n", num);
      break;

    case WStype_PONG:
      Serial.printf("[%u] Pong recibido\n", num);
      break;
  }
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
  Serial.print("Conectando a WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());

  // Iniciar servidor WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("Servidor WebSocket iniciado en puerto 81");
}

void loop() {
  webSocket.loop();
  
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Conexión WiFi perdida. Reconectando...");
    WiFi.begin(ssid, password);
  }
} 