package com.ems.security;

import com.ems.config.TimeZoneConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Answers 401 when a request carries no usable authentication.
 *
 * <p>Without this bean Spring Security falls back to {@code Http403ForbiddenEntryPoint},
 * because the chain configures neither HTTP Basic nor form login - only a custom JWT
 * filter. That default meant an expired, missing or malformed token produced <b>403</b>
 * rather than 401, and the API never emitted 401 at all.
 *
 * <p>That broke session renewal outright. The web client refreshes its access token on
 * 401 and deliberately does not on 403, because a 403 is a genuine permission denial and
 * treating it as an expired session used to log people out mid-task. Since the backend
 * only ever sent 403, the refresh path was unreachable: an hour after logging in - the
 * access token lifetime - every request began failing and the user was stuck on a broken
 * screen until they signed in again by hand.
 *
 * <p>The split is now the conventional one. 401 means "I do not know who you are" and
 * the client should refresh or sign in again; 403, handled by
 * {@link JwtAccessDeniedHandler}, means "I know who you are and you may not do this".
 *
 * <p>The body matches the shape every other error in this application uses, so clients
 * can read {@code message} uniformly. It deliberately says nothing about which part of
 * the token was unacceptable.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;
    private final TimeZoneConfig timeZoneConfig;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper, TimeZoneConfig timeZoneConfig) {
        this.objectMapper = objectMapper;
        this.timeZoneConfig = timeZoneConfig;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now(timeZoneConfig.getZoneId()));
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Unauthorized");
        body.put("message", "Authentication required. Please sign in again.");
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getWriter(), body);
    }
}
