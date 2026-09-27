package com.freedom.freedom_backend.goal;

public class GoalNotFoundException extends RuntimeException {

    public GoalNotFoundException(Long id) {
        super("Goal with id " + id + " was not found");
    }
}