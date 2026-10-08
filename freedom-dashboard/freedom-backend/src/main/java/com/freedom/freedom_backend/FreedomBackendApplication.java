package com.freedom.freedom_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FreedomBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FreedomBackendApplication.class, args);
    }
}