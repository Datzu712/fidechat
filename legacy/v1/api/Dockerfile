# v1 backend (tag api-v1-java): Java 21 + Spring Boot 3.1, built with Maven.
# Same build image the project's original dockerfile used.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY --from=src pom.xml .
RUN mvn -B -q dependency:go-offline
COPY --from=src src ./src
# The pom has no Spring Boot parent, so `package` produces a thin jar (the
# original ran `mvn spring-boot:run`). Copy the runtime dependencies next to
# it and run with an explicit classpath instead.
RUN mvn -B -q -DskipTests package \
    && mvn -B -q dependency:copy-dependencies -DincludeScope=runtime -DoutputDirectory=target/lib

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/lib ./lib
COPY --from=build /app/target/backend-1.0-SNAPSHOT.jar app.jar
# dotenv-java (Dotenv.load()) fails if there is no .env in the working
# directory. It stays empty: real values come from environment variables.
RUN touch .env
EXPOSE 8080
CMD ["java", "-cp", "app.jar:lib/*", "com.fidechat.Main"]
