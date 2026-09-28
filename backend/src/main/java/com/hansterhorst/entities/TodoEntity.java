package com.hansterhorst.entities;

import jakarta.persistence.*;

@Entity()
@Table(name = "todos")
public class TodoEntity extends BaseEntity {

  private String title;
  private boolean completed;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public boolean isCompleted() {
    return completed;
  }

  public void setCompleted(boolean completed) {
    this.completed = completed;
  }
}
