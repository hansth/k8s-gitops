####
#
# The `Dockerfile`, this depends on ../openapi/ and must be built with the REPO ROOT as
# build context:
#
# docker build -t todo-backend:1.0.0 -f backend/Dockerfile .
#
# Then run the container with:
#
# docker run --rm -p 22111:22111 --add-host=host.docker.internal:host-gateway \
#  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/<database> \
#  -e DB_USERNAME=<username> \
#  -e DB_PASSWORD=<password> \
#  todo-backend:1.0.0
#
####
#
# BUILD STAGE
# Maven with Eclipse Temurin JDK 25 on Alpine
# https://hub.docker.com/layers/library/maven/
FROM maven:3.9.16-eclipse-temurin-25-alpine AS build

# Set the working directory for the build
WORKDIR /app

# Copy the OpenAPI module (pom and spec)
COPY openapi/pom.xml openapi/openapi.yaml openapi/

# Install the OpenAPI module into the local Maven repository
RUN mvn -f openapi/pom.xml install -Dexec.skip=true

# Copy the backend source code
COPY backend/ backend/

# Build the backend as a Quarkus fast-jar without running tests
RUN mvn -f backend/pom.xml package -DskipTests

# RUNTIME STAGE
#
# Red Hat UBI 9 OpenJDK 25 runtime image
# https://catalog.redhat.com/en/software/containers/ubi9/openjdk-25-runtime/
FROM registry.access.redhat.com/ubi9/openjdk-25-runtime:1.24 AS runtime

# Run as `root` user and update the package index and
# upgrade all installed packages to their latest versions.
USER root
RUN microdnf upgrade -y --nodocs --setopt=install_weak_deps=0 && microdnf clean all

# Set the language for the container environment
ENV LANGUAGE='en_US:en'

# Copy the dependency libraries owned by user 185
COPY --from=build --chown=185 /app/backend/target/quarkus-app/lib/ /deployments/lib/

# Copy the runnable jar (quarkus-run.jar) owned by user 185
COPY --from=build --chown=185 /app/backend/target/quarkus-app/*.jar /deployments/

# Copy the application classes owned by user 185
COPY --from=build --chown=185 /app/backend/target/quarkus-app/app/ /deployments/app/

# Copy the Quarkus generated files owned by user 185
COPY --from=build --chown=185 /app/backend/target/quarkus-app/quarkus/ /deployments/quarkus/

# Document the port the application listens on
EXPOSE 22111

# Run the container as the non-root user 185
USER 185

# Bind the HTTP server to all interfaces and use the JBoss log manager
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"

# Tell the run script which jar to start
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

# Start the application through the image's Java run script
ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]
