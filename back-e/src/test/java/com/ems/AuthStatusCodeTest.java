package com.ems;

import com.ems.security.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pins the 401-versus-403 split the web client depends on.
 *
 * <p>The client refreshes its access token on 401, and deliberately does not on 403
 * because a 403 is a real permission denial - treating it as an expired session used to
 * log people out mid-task. The backend previously answered 403 for expired and missing
 * tokens too, because no AuthenticationEntryPoint was configured and Spring Security
 * defaults to Http403ForbiddenEntryPoint. The API therefore never emitted 401, the
 * client's refresh path was unreachable, and every user was locked out one hour after
 * signing in when their access token expired.
 *
 * <p>Nothing in the suite covered this, so the whole failure was invisible to CI. These
 * tests exist so it stays covered: they assert the status codes directly rather than any
 * implementation detail, so they hold regardless of how the chain is wired.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("boottest")
class AuthStatusCodeTest {

    /** Any endpoint behind .anyRequest().authenticated(). */
    private static final String AUTHENTICATED_ENDPOINT = "/api/users/me/photo";

    /** Any endpoint behind .hasRole("ADMIN"). */
    private static final String ADMIN_ENDPOINT = "/api/admin/reports/dashboard-stats";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;

    @Value("${jwt.secret}") private String secret;

    // ------------------------------------------------------------ 401 cases

    @Test
    void noTokenGives401() throws Exception {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void malformedTokenGives401() throws Exception {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT).header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredTokenGives401() throws Exception {
        // The exact production scenario: a token that was valid an hour ago.
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT)
                        .header("Authorization", "Bearer " + expiredToken("someone", "ADMIN")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSignedWithAnotherSecretGives401() throws Exception {
        mockMvc.perform(get(AUTHENTICATED_ENDPOINT)
                        .header("Authorization", "Bearer " + foreignToken("someone")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshTokenUsedAsAccessTokenGives401() throws Exception {
        // A refresh token carries no role claim. It used to authenticate as
        // "ROLE_null" and produce 403 - a token problem the client will not act on.
        String refreshToken = jwtUtil.generateRefreshToken("someone");

        mockMvc.perform(get(AUTHENTICATED_ENDPOINT).header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredTokenOnAnAdminRouteAlsoGives401NotForbidden() throws Exception {
        // The status must describe the *token*, not the route. Answering 403 here is
        // what stopped the client from ever refreshing.
        mockMvc.perform(get(ADMIN_ENDPOINT)
                        .header("Authorization", "Bearer " + expiredToken("someone", "ADMIN")))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------ 403 cases

    @Test
    void validTokenWithTheWrongRoleGives403() throws Exception {
        // Authenticated, but an employee may not use an admin route. This must stay
        // 403: the client surfaces it as a normal error and leaves the session alone.
        String employeeToken = jwtUtil.generateAccessToken("an-employee", "EMPLOYEE");

        mockMvc.perform(get(ADMIN_ENDPOINT).header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    // ------------------------------------------------------- accepted token

    @Test
    void validTokenWithTheRightRoleIsAccepted() throws Exception {
        String adminToken = jwtUtil.generateAccessToken("an-admin", "ADMIN");

        int status = mockMvc.perform(get(ADMIN_ENDPOINT).header("Authorization", "Bearer " + adminToken))
                .andReturn().getResponse().getStatus();

        assertThat(status)
                .as("a valid admin token must not be rejected by the security chain")
                .isNotIn(401, 403);
    }

    // ------------------------------------------------------------- fixtures

    private String expiredToken(String subject, String role) {
        long anHourAgo = System.currentTimeMillis() - 3_600_000L;
        return Jwts.builder()
                .claim("role", role)
                .setSubject(subject)
                .setIssuedAt(new Date(anHourAgo - 1000))
                .setExpiration(new Date(anHourAgo))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();
    }

    private String foreignToken(String subject) {
        String otherSecret = "a-completely-different-secret-of-at-least-32-bytes-abcdef";
        return Jwts.builder()
                .claim("role", "ADMIN")
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3_600_000L))
                .signWith(Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();
    }
}
