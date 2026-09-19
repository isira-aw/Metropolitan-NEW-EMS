package com.ems;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Boots the full Spring application context against an in-memory database.
 *
 * <p>This is the cheapest possible guard against the class of bug that only shows up
 * at startup and therefore never appears in a compile or a unit test: an invalid
 * {@code @Query}, an entity mapping Hibernate rejects, a filter registered against a
 * position Spring Security does not know, a missing bean, a circular dependency.
 * Those all compile perfectly and then take the application down on deploy.
 *
 * <p>It earned its place immediately - the first run failed with "The Filter class
 * JwtAuthenticationFilter does not have a registered order", a security-config change
 * that compiled cleanly and would have prevented the application from starting.
 *
 * <p>Uses the {@code boottest} profile (see
 * src/test/resources/application-boottest.properties), which points at H2 and supplies
 * the environment variables the application requires at startup.
 */
@SpringBootTest
@ActiveProfiles("boottest")
class ContextLoadsSmokeTest {

    @Test
    void contextLoads() {
        // Intentionally empty: the assertion is that the context started at all.
    }
}
