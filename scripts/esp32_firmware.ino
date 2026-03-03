/*
 * Sistema IoT de Seguridad - Firmware ESP32-S3
 * Control de puertas con sensor magnético y lector RFID
 * 
 * Ubicaciones disponibles:
 * - SANTIAGO CASA MATRIZ
 * - ANTOFAGASTA
 * - COQUIMBO
 * - CONCEPCION
 * - PUERTO MONTT
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>

// Configuración WiFi
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// Configuración del servidor
const char* API_URL = "https://tu-proyecto.vercel.app/api/door/event";

// Configuración del tablero (CAMBIAR PARA CADA UBICACIÓN)
const char* BOARD_NAME = "Puerta Principal";
const char* LOCATION = "SANTIAGO CASA MATRIZ";  // Cambiar según ubicación

// Pines
#define DOOR_SENSOR_PIN 4   // Sensor magnético
#define SS_PIN 5            // RFID SS
#define RST_PIN 22          // RFID RST

MFRC522 rfid(SS_PIN, RST_PIN);
bool doorWasOpen = false;
unsigned long doorOpenTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Configurar pines
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  
  // Inicializar SPI y RFID
  SPI.begin();
  rfid.PCD_Init();
  
  // Conectar WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  Serial.println("Sistema de seguridad iniciado");
  Serial.print("Ubicación: ");
  Serial.println(LOCATION);
}

void loop() {
  // Leer estado de la puerta
  bool doorOpen = digitalRead(DOOR_SENSOR_PIN) == HIGH;
  
  // Detectar cambio de estado
  if (doorOpen && !doorWasOpen) {
    // Puerta se abrió
    doorOpenTime = millis();
    sendEvent("open", false, "Puerta abierta por sensor");
    doorWasOpen = true;
  } 
  else if (!doorOpen && doorWasOpen) {
    // Puerta se cerró
    unsigned long duration = (millis() - doorOpenTime) / 1000;
    String details = "Puerta cerrada. Duración: " + String(duration) + "s";
    sendEvent("close", false, details.c_str());
    doorWasOpen = false;
  }
  
  // Leer tarjeta RFID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = getUID();
    Serial.print("Tarjeta detectada: ");
    Serial.println(uid);
    
    // Por ahora, marcar como no autorizado
    // El servidor verificará contra la base de datos
    String details = "RFID: " + uid;
    sendEvent("unauthorized", false, details.c_str());
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
  
  delay(100);
}

String getUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void sendEvent(const char* eventType, bool authorized, const char* details) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado");
    return;
  }
  
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Crear JSON
  String json = "{";
  json += "\"board_name\":\"" + String(BOARD_NAME) + "\",";
  json += "\"location\":\"" + String(LOCATION) + "\",";
  json += "\"event_type\":\"" + String(eventType) + "\",";
  json += "\"authorized\":" + String(authorized ? "true" : "false") + ",";
  json += "\"details\":{\"note\":\"" + String(details) + "\"}";
  json += "}";
  
  Serial.println("Enviando evento: " + json);
  
  int httpCode = http.POST(json);
  
  if (httpCode > 0) {
    Serial.print("Respuesta del servidor: ");
    Serial.println(httpCode);
    if (httpCode == 200) {
      Serial.println("Evento registrado exitosamente");
    }
  } else {
    Serial.print("Error en la petición: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}
