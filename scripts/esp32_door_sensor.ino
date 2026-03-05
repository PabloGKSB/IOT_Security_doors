/*
 * ESP32-S3 Door Sensor + Auto Status — Con Configuración Remota
 *
 * ─────────────────────────────────────────────
 * ÚNICO valor hardcodeado: BOARD_ID
 * Todo lo demás (board_name, location) se descarga
 * desde el servidor al arrancar vía GET /api/config
 * ─────────────────────────────────────────────
 *
 * Hardware:
 * - ESP32-S3 Dev Board
 * - Reed Switch en DOOR_SENSOR_PIN (GPIO 4)
 * - Pin de estado automático en AUTO_STATUS_PIN (GPIO 5)
 * - Buzzer opcional en BUZZER_PIN (GPIO 2)
 *
 * Dependencias Arduino:
 * - ArduinoJson (by Benoit Blanchon)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── CREDENCIALES WiFi ───────────────────────────────────────
const char* WIFI_SSID     = "pablo";
const char* WIFI_PASSWORD = "1234567890";

// ─── BASE URL del servidor ───────────────────────────────────
// Solo cambiar si deployed en otro dominio
const char* API_BASE = "https://iot-security-doors.vercel.app";

// ─── ÚNICO VALOR HARDCODEADO POR TABLERO ────────────────────
// Debe coincidir exactamente con el door_id en /admin/assets
const char* BOARD_ID = "ESP32-SANTIAGO-01";

// ─── CONFIG DESCARGADA REMOTAMENTE (se cargan en fetchConfig) ──
char g_board_name[64] = "";   // Se llena desde /api/config
char g_location[64]   = "";   // Se llena desde /api/config
bool g_active         = true; // Si false, el tablero no reporta

// ─── PINES ───────────────────────────────────────────────────
#define DOOR_SENSOR_PIN  4
#define AUTO_STATUS_PIN  5
#define BUZZER_PIN       2

// ─── AJUSTE DE POLARIDAD DEL REED SWITCH ────────────────────
// false → LOW=abierta (imán lejos activa el pin)
// true  → LOW=cerrada  (imán cerca activa el pin)
const bool MAGNET_NEAR_IS_CLOSED = false;

// ─── DEBOUNCE PUERTA ─────────────────────────────────────────
const int           DOOR_STABLE_READS  = 8;
const int           READ_INTERVAL_MS   = 25;

// ─── DEBOUNCE AUTOMÁTICO ─────────────────────────────────────
const unsigned long AUTO_DEBOUNCE_MS   = 250;

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

static String escapeJson(const String& s) {
  String out;
  out.reserve(s.length());
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if      (c == '"')  out += "\\\"";
    else if (c == '\\') out += "\\\\";
    else if (c == '\n') out += "\\n";
    else if (c == '\r') out += "\\r";
    else                out += c;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Lectura de sensores
// ─────────────────────────────────────────────────────────────

bool readDoorOpen() {
  bool pinHigh   = (digitalRead(DOOR_SENSOR_PIN) == HIGH);
  bool magnetNear = !pinHigh;  // LOW  = imán cerca (INPUT_PULLUP)
  bool closed    = MAGNET_NEAR_IS_CLOSED ? magnetNear : !magnetNear;
  return !closed;
}

bool readAutoOn() {
  // INPUT_PULLUP: HIGH = sin contacto = automático ARRIBA (ON)
  return digitalRead(AUTO_STATUS_PIN) == HIGH;
}

// ─────────────────────────────────────────────────────────────
// WiFi
// ─────────────────────────────────────────────────────────────

void connectWiFi() {
  Serial.printf("[WIFI] Conectando a %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Conectado! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] ERROR: No se pudo conectar.");
  }
}

// ─────────────────────────────────────────────────────────────
// Descarga de configuración remota
// ─────────────────────────────────────────────────────────────

bool fetchConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[CONFIG] Sin WiFi, no se puede descargar la configuración.");
    return false;
  }

  String url = String(API_BASE) + "/api/config?board_id=" + String(BOARD_ID);
  Serial.println("[CONFIG] GET " + url);

  HTTPClient http;
  http.begin(url);
  int code = http.GET();

  if (code != 200) {
    Serial.printf("[CONFIG] ERROR HTTP %d — usando valores por defecto.\n", code);
    http.end();
    return false;
  }

  String body = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    Serial.println("[CONFIG] ERROR parseando JSON — usando valores por defecto.");
    return false;
  }

  if (!doc["ok"].as<bool>()) {
    Serial.println("[CONFIG] Servidor respondió ok=false — usando valores por defecto.");
    return false;
  }

  // Guardar en variables globales
  strlcpy(g_board_name, doc["board_name"] | BOARD_ID, sizeof(g_board_name));
  strlcpy(g_location,   doc["location"]   | "SIN UBICACION", sizeof(g_location));
  g_active = doc["active"] | true;

  Serial.printf("[CONFIG] board_name : %s\n", g_board_name);
  Serial.printf("[CONFIG] location   : %s\n", g_location);
  Serial.printf("[CONFIG] active     : %s\n", g_active ? "SI" : "NO");
  return true;
}

// ─────────────────────────────────────────────────────────────
// Envío de eventos al servidor
// ─────────────────────────────────────────────────────────────

void sendEvent(const char* eventType, const String& detailsJson) {
  if (!g_active) {
    Serial.println("[WARN] Tablero inactivo, evento no enviado.");
    return;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi desconectado, evento no enviado.");
    return;
  }

  String url = String(API_BASE) + "/api/door/event";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"door_id\":\""    + String(BOARD_ID)     + "\",";
  json += "\"board_name\":\"" + String(g_board_name) + "\",";
  json += "\"location\":\""   + String(g_location)   + "\",";
  json += "\"event_type\":\"" + String(eventType)    + "\",";
  json += "\"details\":"      + detailsJson;
  json += "}";

  Serial.println("[HTTP] POST " + url);
  Serial.println("[HTTP] Body: " + json);

  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.printf("[HTTP] %d — %s\n", httpCode, http.getString().c_str());
  } else {
    Serial.printf("[HTTP] ERROR: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ─────────────────────────────────────────────────────────────
// Estado de puerta (debounce)
// ─────────────────────────────────────────────────────────────

bool         lastRawDoorOpen  = false;
int          doorStableCount  = 0;
bool         doorIsOpen       = false;
unsigned long doorOpenTimeMs  = 0;

// ─────────────────────────────────────────────────────────────
// Estado automático (debounce)
// ─────────────────────────────────────────────────────────────

bool          autoWasOn          = false;
unsigned long autoLastChangeMs   = 0;

// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  pinMode(AUTO_STATUS_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN,      OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // 1. Conectar WiFi
  connectWiFi();

  // 2. Descargar configuración remota
  //    Si falla, g_board_name queda vacío → usamos BOARD_ID como fallback
  if (!fetchConfig()) {
    strlcpy(g_board_name, BOARD_ID,          sizeof(g_board_name));
    strlcpy(g_location,   "SIN UBICACION",   sizeof(g_location));
  }

  // 3. Leer estado inicial
  doorIsOpen       = readDoorOpen();
  lastRawDoorOpen  = doorIsOpen;
  doorStableCount  = DOOR_STABLE_READS;
  autoWasOn        = readAutoOn();

  if (doorIsOpen) doorOpenTimeMs = millis();

  Serial.printf("[BOOT] Puerta     : %s\n", doorIsOpen ? "ABIERTA" : "CERRADA");
  Serial.printf("[BOOT] Automático : %s\n", autoWasOn  ? "ARRIBA (ON)" : "ABAJO (OFF)");
}

// ─────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────

void loop() {
  // Reconexión WiFi si se pierde
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi perdido, reconectando...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(3000);
    return;
  }

  // ── PUERTA ────────────────────────────────────────────────
  bool currentRawDoor = readDoorOpen();

  if (currentRawDoor == lastRawDoorOpen) {
    // Contador con tope para evitar overflow
    if (doorStableCount < DOOR_STABLE_READS + 1) doorStableCount++;
  } else {
    doorStableCount  = 0;
    lastRawDoorOpen  = currentRawDoor;
  }

  if (doorStableCount >= DOOR_STABLE_READS && currentRawDoor != doorIsOpen) {
    doorIsOpen = currentRawDoor;
    unsigned long now = millis();

    if (doorIsOpen) {
      doorOpenTimeMs = now;
      sendEvent("open", "{\"note\":\"Puerta abierta (estado estable)\"}");
      Serial.println("[STATE] PUERTA ABIERTA");
    } else {
      unsigned long durationS = (now - doorOpenTimeMs) / 1000;
      String note = "Puerta cerrada. Duración: " + String(durationS) + "s";
      sendEvent("close", "{\"note\":\"" + escapeJson(note) + "\"}");
      Serial.println("[STATE] PUERTA CERRADA — duración: " + String(durationS) + "s");
    }
  }

  // ── AUTOMÁTICO ────────────────────────────────────────────
  bool autoOn = readAutoOn();
  if (autoOn != autoWasOn) {
    unsigned long now = millis();
    if (now - autoLastChangeMs > AUTO_DEBOUNCE_MS) {
      autoLastChangeMs = now;
      autoWasOn        = autoOn;

      if (autoOn) {
        sendEvent("power_up",   "{\"note\":\"Automático subido (ON)\"}");
        Serial.println("[AUTO] SUBIDO (power_up)");
      } else {
        sendEvent("power_down", "{\"note\":\"Automático bajado (OFF)\"}");
        Serial.println("[AUTO] BAJADO (power_down)");
      }
    }
  }

  delay(READ_INTERVAL_MS);
}
