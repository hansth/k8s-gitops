package com.hansterhorst;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

@QuarkusTest
class TodoResourceTest {

    private long createTodo() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"title\":\"todo\",\"completed\":false}")
                .when().post("/api/todos")
                .then()
                .statusCode(204);

        List<Long> ids = given()
                .when().get("/api/todos")
                .then()
                .statusCode(200)
                .extract().jsonPath().getList("id", Long.class);

        return ids.stream().mapToLong(Long::longValue).max().orElseThrow();
    }

    @Test
    void testCreateAndListTodo() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"title\":\"todo\",\"completed\":false}")
                .when().post("/api/todos")
                .then()
                .statusCode(204);

        given()
                .when().get("/api/todos")
                .then()
                .statusCode(200)
                .body("title", hasItem("todo"))
                .body("completed", hasItem(false));
    }

    @Test
    void testGetByIdFound() {
        long id = createTodo();

        given()
                .when().get("/api/todos/" + id)
                .then()
                .statusCode(200)
                .body("id", equalTo((int) id))
                .body("title", equalTo("todo"))
                .body("completed", equalTo(false));
    }

    @Test
    void testGetByIdNotFound() {
        given()
                .when().get("/api/todos/999999")
                .then()
                .statusCode(404);
    }

    @Test
    void testUpdateTodo() {
        long id = createTodo();

        given()
                .contentType(ContentType.JSON)
                .body("{\"title\":\"updated\",\"completed\":true}")
                .when().put("/api/todos/" + id)
                .then()
                .statusCode(204);

        given()
                .when().get("/api/todos/" + id)
                .then()
                .statusCode(200)
                .body("title", equalTo("updated"))
                .body("completed", equalTo(true));
    }

    @Test
    void testUpdateNotFound() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"title\":\"updated\",\"completed\":true}")
                .when().put("/api/todos/999999")
                .then()
                .statusCode(404);
    }

    @Test
    void testDeleteTodo() {
        long id = createTodo();

        given()
                .when().delete("/api/todos/" + id)
                .then()
                .statusCode(204);

        given()
                .when().get("/api/todos/" + id)
                .then()
                .statusCode(404);
    }

    @Test
    void testDeleteNotFound() {
        given()
                .when().delete("/api/todos/999999")
                .then()
                .statusCode(404);
    }
}