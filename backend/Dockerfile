####
# Builds the backend from source (no local `./mvnw package` needed first) and produces
# a runnable JVM-mode image.
#
# This module depends on ../openapi/ (com.hansterhorst:openapi, see ../openapi/README.md),
# which isn't on Maven Central, so it must be built with the REPO ROOT as build context,
# not this directory:
#
# docker build -f backend/Dockerfile -t todo-backend .
#
# Then run it with:
#
# docker run -i --rm -p 22111:22111 todo-backend
#
# `mvn install` on ../openapi/ also normally regenerates schema.d.ts for the npm
# (frontend) side via an exec-maven-plugin step that shells out to `npm run generate`.
# This image only needs the Java side (the generated JAX-RS interfaces/DTOs the Maven
# jar is built from), so that npm step is skipped with -Dexec.skip=true — it's a
# separate plugin execution from the Java codegen/packaging and skipping it just avoids
# needing a Node.js toolchain in this build stage for an output this image never uses.
#
# Tests are skipped in this build: `%test` uses Quarkus Dev Services (Testcontainers),
# which needs a Docker socket that isn't available inside `docker build`.
###
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY openapi/pom.xml openapi/openapi.yaml openapi/
RUN mvn -f openapi/pom.xml install -Dexec.skip=true

COPY backend/ backend/
RUN mvn -f backend/pom.xml package -DskipTests

FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.24 AS runtime

ENV LANGUAGE='en_US:en'

# We make four distinct layers so if there are application changes the library layers can be re-used
COPY --from=build --chown=185 /app/backend/target/quarkus-app/lib/ /deployments/lib/
COPY --from=build --chown=185 /app/backend/target/quarkus-app/*.jar /deployments/
COPY --from=build --chown=185 /app/backend/target/quarkus-app/app/ /deployments/app/
COPY --from=build --chown=185 /app/backend/target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 22111
USER 185
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]