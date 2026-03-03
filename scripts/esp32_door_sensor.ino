/*
 * ESP32-S3 Door Sensor Security System
 * 
 * Hardware Requirements:
 * - ESP32-S3 Dev Board
 * - Magnetic Reed Switch (Door Sensor)
 * - RFID-RC522 Module (for authorization)
 * - Buzzer (optional for local alerts)
 * 
 * Pin Configuration:
 * - DOOR_SENSOR_PIN: GPIO 4 (Reed switch)
 * - RFID SDA/SS: GPIO 5
 * - RFID SCK: GPIO 18
 * - RFID MOSI: GPIO 23
 * - RFID MISO: GPIO 19
 * - RFID RST: GPIO 22
 * - BUZZER_PIN: GPIO 2
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <SPI.h>

// WiFi credentials - CHANGE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint - CHANGE THIS to your deployed URL
const char* serverUrl = "https://your-app.vercel.app/api/door/event";

// IMPORTANT: Configure these values for each ESP32 board
// Example configurations for each location:
// SANTIAGO: boardName = "ESP32-SANTIAGO-01", location = "SANTIAGO CASA MATRIZ"
// ANTOFAGASTA: boardName = "ESP32-ANTOFAGASTA-01", location = "ANTOFAGASTA"
// COQUIMBO: boardName = "ESP32-COQUIMBO-01", location = "COQUIMBO"
// CONCEPCIÓN: boardName = "ESP32-CONCEPCION-01", location = "CONCEPCIÓN"
// PUERTO MONTT: boardName = "ESP32-PUERTOMONTT-01", location = "PUERTO MONTT"

const char* boardName = "ESP32-SANTIAGO-01";  // Change for each board
const char* location = "SANTIAGO CASA MATRIZ";  // Must match database locations

// Pin definitions
#define DOOR_SENSOR_PIN 4
#define BUZZER_PIN 2
#define RST_PIN 22
#define SS_PIN 5

// RFID setup
MFRC522 rfid(SS_PIN, RST_PIN);

// Authorized RFID UIDs (add your card UIDs here)
byte authorizedUIDs[][4] = {
  {0xDE, 0xAD, 0xBE, 0xEF},  // Example UID 1
  {0xCA, 0xFE, 0xBA, 0xBE}   // Example UID 2
};
const int numAuthorizedCards = 2;

// State tracking
bool lastDoorState = HIGH;  // HIGH = closed, LOW = open
bool rfidAuthorized = false;
unsigned long lastRfidCheck = 0;
const unsigned long RFID_CHECK_INTERVAL = 1000;  // Check RFID every 1 second
const unsigned long AUTH_TIMEOUT = 5000;  // Authorization valid for 5 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32-S3 Door Sensor Starting...");
  
  // Initialize pins
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize SPI and RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID initialized");
  
  // Connect to WiFi
  connectWiFi();
  
  // Read initial door state
  lastDoorState = digitalRead(DOOR_SENSOR_PIN);
  Serial.printf("Initial door state: %s\n", lastDoorState == HIGH ? "CLOSED" : "OPEN");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
  }
  
  // Check for RFID card
  checkRFID();
  
  // Read door sensor
  bool currentDoorState = digitalRead(DOOR_SENSOR_PIN);
  
  // Detect state change
  if (currentDoorState != lastDoorState) {
    delay(50);  // Debounce
    currentDoorState = digitalRead(DOOR_SENSOR_PIN);
    
    if (currentDoorState != lastDoorState) {
      lastDoorState = currentDoorState;
      handleDoorEvent(currentDoorState);
    }
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void checkRFID() {
  if (millis() - lastRfidCheck < RFID_CHECK_INTERVAL) {
    return;
  }
  lastRfidCheck = millis();
  
  // Reset authorization if timeout expired
  if (rfidAuthorized && millis() - lastRfidCheck > AUTH_TIMEOUT) {
    rfidAuthorized = false;
  }
  
  // Check for new card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }
  
  Serial.print("RFID detected: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();
  
  // Check if card is authorized
  bool authorized = false;
  for (int i = 0; i < numAuthorizedCards; i++) {
    if (memcmp(rfid.uid.uidByte, authorizedUIDs[i], 4) == 0) {
      authorized = true;
      break;
    }
  }
  
  if (authorized) {
    Serial.println("Access GRANTED");
    rfidAuthorized = true;
    beep(2, 100);  // Two short beeps
    sendEvent("authorized", true, "RFID card authorized");
  } else {
    Serial.println("Access DENIED");
    beep(1, 500);  // One long beep
    sendEvent("unauthorized", false, "Unknown RFID card");
  }
  
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void handleDoorEvent(bool doorState) {
  String eventType;
  bool authorized = false;
  String details = "";
  
  if (doorState == LOW) {  // Door opened
    if (rfidAuthorized) {
      eventType = "open";
      authorized = true;
      details = "Door opened with authorization";
      Serial.println("Door OPENED (Authorized)");
      rfidAuthorized = false;  // Reset authorization
    } else {
      eventType = "forced";
      authorized = false;
      details = "Door opened without authorization";
      Serial.println("Door OPENED (FORCED/UNAUTHORIZED)");
      beep(3, 200);  // Three beeps for alert
    }
  } else {  // Door closed
    eventType = "close";
    authorized = true;
    details = "Door closed";
    Serial.println("Door CLOSED");
  }
  
  sendEvent(eventType, authorized, details);
}

void sendEvent(String eventType, bool authorized, String details) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send event - WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> doc;
  doc["event_type"] = eventType;
  doc["authorized"] = authorized;
  doc["door_id"] = "main_door";
  doc["board_name"] = boardName;
  doc["location"] = location;
  
  JsonObject detailsObj = doc.createNestedObject("details");
  detailsObj["message"] = details;
  detailsObj["rssi"] = WiFi.RSSI();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.printf("Sending event: %s\n", jsonPayload.c_str());
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("Response: %d - %s\n", httpResponseCode, response.c_str());
  } else {
    Serial.printf("Error sending event: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

void beep(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) {
      delay(duration);
    }
  }
}
