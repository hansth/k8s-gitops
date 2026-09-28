package com.hansterhorst.repositories;

import com.hansterhorst.entities.TodoEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TodoRepository implements PanacheRepository<TodoEntity> {}
