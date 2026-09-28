package com.freedom.freedom_backend.transaction;

public class TransactionNotFoundException
        extends RuntimeException {

    public TransactionNotFoundException(Long id) {
        super("Transaction with id " + id + " was not found");
    }
}