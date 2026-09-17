package com.hansterhorst.repositories;

import com.hansterhorst.entities.TodoEntity;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class TodoRepositoryTest {

    @Inject
    TodoRepository todoRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    @Transactional
    void clearTodos() {
        todoRepository.deleteAll();
    }

    private TodoEntity newTodo(String title, boolean completed) {
        TodoEntity todoEntity = new TodoEntity();
        todoEntity.setTitle(title);
        todoEntity.setCompleted(completed);
        return todoEntity;
    }

    @Test
    @TestTransaction
    void testPersistAndFindById() {
        TodoEntity todoEntity = newTodo("todo", false);
        todoRepository.persist(todoEntity);

        assertTrue(todoEntity.getId() > 0);

        TodoEntity found = todoRepository.findById(todoEntity.getId());
        assertEquals("todo", found.getTitle());
        assertFalse(found.isCompleted());
    }

    @Test
    @TestTransaction
    void testFindAll() {
        todoRepository.persist(newTodo("first", false));
        todoRepository.persist(newTodo("second", true));

        List<TodoEntity> all = todoRepository.findAll().list();

        assertEquals(2, all.size());
    }

    @Test
    @TestTransaction
    void testUpdate() {
        TodoEntity todoEntity = newTodo("todo", false);
        todoRepository.persist(todoEntity);

        int updated = todoRepository.update("title = ?1, completed = ?2 where id = ?3",
                "updated", true, todoEntity.getId());

        assertEquals(1, updated);

        // The bulk update above runs directly against the DB and bypasses the
        // persistence context, so the already-managed todoEntity instance won't
        // reflect it. Clear the context to force a real re-read.
        entityManager.clear();

        TodoEntity found = todoRepository.findById(todoEntity.getId());
        assertEquals("updated", found.getTitle());
        assertTrue(found.isCompleted());
    }

    @Test
    @TestTransaction
    void testDeleteById() {
        TodoEntity todoEntity = newTodo("todo", false);
        todoRepository.persist(todoEntity);

        boolean deleted = todoRepository.deleteById(todoEntity.getId());

        assertTrue(deleted);
        assertNull(todoRepository.findById(todoEntity.getId()));
    }

    @Test
    @TestTransaction
    void testDeleteByIdNotFound() {
        boolean deleted = todoRepository.deleteById(999999L);

        assertFalse(deleted);
    }
}