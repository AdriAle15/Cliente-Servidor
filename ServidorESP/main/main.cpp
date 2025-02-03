#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "driver/gpio.h"
#include "cJSON.h"

// Declaración explícita de app_main
#if defined(__cplusplus)
extern "C" {
#endif

void app_main(void);

#if defined(__cplusplus)
}
#endif

static const char *TAG = "LED_SERVER";

// Configuración WiFi
const char* WIFI_SSID = "SSD";
const char* WIFI_PASS = "password";

// Definir pines para los LEDs
#define LED_PIN_1 GPIO_NUM_12
#define LED_PIN_2 GPIO_NUM_14
#define LED_PIN_3 GPIO_NUM_27

// Variables para almacenar estados de LEDs
static bool led_state_1 = false;
static bool led_state_2 = false;
static bool led_state_3 = false;

// Manejador del servidor HTTP
static httpd_handle_t server = NULL;

// Función para manejar las solicitudes CORS
static esp_err_t set_cors_headers(httpd_req_t *req) {
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
    return ESP_OK;
}

// Manejador para solicitudes OPTIONS (CORS preflight)
static esp_err_t options_handler(httpd_req_t *req) {
    set_cors_headers(req);
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
}

// Función para manejar los comandos LED
static esp_err_t led_handler(httpd_req_t *req)
{
    set_cors_headers(req);
    
    // Buffer para recibir el contenido
    char buf[128];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) {
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(req);
        }
        return ESP_FAIL;
    }
    buf[ret] = '\0';

    ESP_LOGI(TAG, "Received: %s", buf);

    // Parsear JSON
    cJSON *json = cJSON_Parse(buf);
    if (json == NULL) {
        const char *error_resp = "{\"error\":\"Invalid JSON\"}";
        httpd_resp_set_type(req, "application/json");
        httpd_resp_send(req, error_resp, strlen(error_resp));
        return ESP_OK;
    }

    // Procesar comando
    cJSON *command = cJSON_GetObjectItem(json, "command");
    if (cJSON_IsString(command)) {
        if (strcmp(command->valuestring, "led1:on") == 0) {
            gpio_set_level(LED_PIN_1, 1);
            led_state_1 = true;
        } else if (strcmp(command->valuestring, "led1:off") == 0) {
            gpio_set_level(LED_PIN_1, 0);
            led_state_1 = false;
        } else if (strcmp(command->valuestring, "led2:on") == 0) {
            gpio_set_level(LED_PIN_2, 1);
            led_state_2 = true;
        } else if (strcmp(command->valuestring, "led2:off") == 0) {
            gpio_set_level(LED_PIN_2, 0);
            led_state_2 = false;
        } else if (strcmp(command->valuestring, "led3:on") == 0) {
            gpio_set_level(LED_PIN_3, 1);
            led_state_3 = true;
        } else if (strcmp(command->valuestring, "led3:off") == 0) {
            gpio_set_level(LED_PIN_3, 0);
            led_state_3 = false;
        }
    }

    // Crear respuesta
    cJSON *response = cJSON_CreateObject();
    cJSON_AddStringToObject(response, "status", "success");
    cJSON_AddStringToObject(response, "message", "LED state updated");
    cJSON_AddBoolToObject(response, "led1", led_state_1);
    cJSON_AddBoolToObject(response, "led2", led_state_2);
    cJSON_AddBoolToObject(response, "led3", led_state_3);
    
    char *response_str = cJSON_Print(response);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, response_str, strlen(response_str));

    // Limpieza
    free(response_str);
    cJSON_Delete(response);
    cJSON_Delete(json);

    return ESP_OK;
}

// Configuración de las URIs
static const httpd_uri_t uri_options = {
    .uri      = "/*",
    .method   = HTTP_OPTIONS,
    .handler  = options_handler,
    .user_ctx = NULL
};

static const httpd_uri_t uri_led = {
    .uri      = "/led",
    .method   = HTTP_POST,
    .handler  = led_handler,
    .user_ctx = NULL
};

// Función para inicializar el servidor HTTP
static void start_webserver(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;
    config.lru_purge_enable = true;
    config.max_open_sockets = 5;
    config.recv_wait_timeout = 10;
    config.send_wait_timeout = 10;

    if (httpd_start(&server, &config) == ESP_OK) {
        ESP_LOGI(TAG, "Starting server on port: '%d'", config.server_port);
        httpd_register_uri_handler(server, &uri_options);
        httpd_register_uri_handler(server, &uri_led);
        
        esp_netif_ip_info_t ip_info;
        esp_netif_t* netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
        if (netif) {
            esp_netif_get_ip_info(netif, &ip_info);
            ESP_LOGI(TAG, "Server IP: " IPSTR, IP2STR(&ip_info.ip));
        }
    } else {
        ESP_LOGE(TAG, "Error starting server!");
    }
}

// Función para inicializar GPIO
static void init_gpio(void)
{
    gpio_config_t io_conf = {};
    io_conf.intr_type = GPIO_INTR_DISABLE;
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pin_bit_mask = (1ULL<<LED_PIN_1) | (1ULL<<LED_PIN_2) | (1ULL<<LED_PIN_3);
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    gpio_config(&io_conf);

    gpio_set_level(LED_PIN_1, 0);
    gpio_set_level(LED_PIN_2, 0);
    gpio_set_level(LED_PIN_3, 0);
}

// Evento handler para WiFi
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                             int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGI(TAG, "Retry connecting to the AP");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        start_webserver();
    }
}

// Función para inicializar WiFi
static void wifi_init(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL));

    // Inicializar la configuración WiFi
    wifi_config_t wifi_config = {};
    memset(&wifi_config, 0, sizeof(wifi_config_t));
    
    // Configurar el modo STA (cliente)
    memcpy(wifi_config.sta.ssid, WIFI_SSID, strlen(WIFI_SSID));
    memcpy(wifi_config.sta.password, WIFI_PASS, strlen(WIFI_PASS));
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = true;
    wifi_config.sta.pmf_cfg.required = false;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
}

// Implementación de app_main
void app_main(void)
{
    // Inicializar NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Inicializar componentes
    init_gpio();
    wifi_init();

    ESP_LOGI(TAG, "ESP32 LED Server iniciado");
    
    // Mantener la tarea principal viva
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
} 
