package com.freedom.freedom_backend.recurring;

public class RecurringTransactionNotFoundException
        extends RuntimeException {

    public RecurringTransactionNotFoundException(Long id) {
        super(
                "Recurring transaction with id "
                        + id
                        + " was not found"
        );
    }
}