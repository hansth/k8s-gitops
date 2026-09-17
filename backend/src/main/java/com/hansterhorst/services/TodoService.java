package com.hansterhorst.services;

import com.hansterhorst.entities.TodoEntity;
import com.hansterhorst.exceptions.NotFoundException;
import com.hansterhorst.repositories.TodoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class TodoService {

    @Inject
    TodoRepository todoRepository;

    @Transactional
    public void create(TodoEntity todoEntity) {
        todoRepository.persist(todoEntity);
    }

    public TodoEntity findById(Long id) {
        TodoEntity todoEntity = todoRepository.findById(id);
        if (todoEntity == null) {
            throw new NotFoundException("Todo not found: " + id);
        }
        return todoEntity;
    }

    public List<TodoEntity> findAll() {
        return todoRepository.findAll().stream().toList();
    }

    @Transactional
    public void deleteById(Long id) {
        boolean deleted = todoRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundException("Todo not found: " + id);
        }
    }

    @Transactional
    public void update(Long id, TodoEntity todoEntity) {
        int updated = todoRepository.update("title = ?1, completed = ?2 where id = ?3",
                todoEntity.getTitle(), todoEntity.isCompleted(), id);
        if (updated == 0) {
            throw new NotFoundException("Todo not found: " + id);
        }
    }
}
