package com.freedom.freedom_backend.imports.myfinance;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackageClasses = MyFinanceImportController.class)
public class MyFinanceImportExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badRequest(IllegalArgumentException exception) {
        return Map.of("message", exception.getMessage() == null ? "Nie udało się zaimportować backupu." : exception.getMessage());
    }
}
