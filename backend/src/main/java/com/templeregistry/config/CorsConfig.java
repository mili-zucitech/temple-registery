package com.templeregistry.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsRaw;

    @Value("${app.storage.base-dir:./uploads}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOriginsRaw.split(",");
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        
        registry.addMapping("/uploads/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "OPTIONS");
    }

    @Override
    public void addResourceHandlers(org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry registry) {
        java.nio.file.Path base = java.nio.file.Path.of(uploadDir).toAbsolutePath().normalize();
        String absolutePath = "file:" + base.toString() + (base.toString().endsWith("/") ? "" : "/");
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absolutePath);
    }
}
