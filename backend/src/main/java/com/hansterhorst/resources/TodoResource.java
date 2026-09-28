package com.hansterhorst.resources;

import com.hansterhorst.entities.TodoEntity;
import com.hansterhorst.resources.generated.api.TodosApi;
import com.hansterhorst.resources.generated.model.Todo;
import com.hansterhorst.services.TodoService;
import jakarta.inject.Inject;
import java.util.List;

public class TodoResource implements TodosApi {

  @Inject TodoService todoService;

  @Override
  public void createTodo(Todo todo) {
    todoService.create(toEntity(todo));
  }

  @Override
  public void deleteTodo(Long id) {
    todoService.deleteById(id);
  }

  @Override
  public Todo getTodoById(Long id) {
    return toModel(todoService.findById(id));
  }

  @Override
  public List<Todo> listTodos() {
    return todoService.findAll().stream().map(TodoResource::toModel).toList();
  }

  @Override
  public void updateTodo(Long id, Todo todo) {
    todoService.update(id, toEntity(todo));
  }

  private static TodoEntity toEntity(Todo todo) {
    TodoEntity todoEntity = new TodoEntity();
    todoEntity.setTitle(todo.getTitle());
    todoEntity.setCompleted(Boolean.TRUE.equals(todo.getCompleted()));
    return todoEntity;
  }

  private static Todo toModel(TodoEntity todoEntity) {
    Todo todo = new Todo();
    todo.setId(todoEntity.getId());
    todo.setTitle(todoEntity.getTitle());
    todo.setCompleted(todoEntity.isCompleted());
    return todo;
  }
}
