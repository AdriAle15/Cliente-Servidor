idf_component_register(
    SRCS "main.cpp"
    INCLUDE_DIRS "."
    REQUIRES esp_wifi
            nvs_flash
            esp_http_server
            driver
            cJSON
            mbedtls
)

set_source_files_properties(main.cpp 
    PROPERTIES 
    COMPILE_FLAGS "-x c++"
)
