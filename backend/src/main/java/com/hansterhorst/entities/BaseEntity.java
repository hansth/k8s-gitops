package com.hansterhorst.entities;

import jakarta.persistence.*;

@MappedSuperclass
public class BaseEntity {

  @Id
  @SequenceGenerator(name = "entity_seq", allocationSize = 1)
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "entity_seq")
  private Long id;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }
}
