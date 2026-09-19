package com.ems.security;

import com.ems.config.TimeZoneConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Answers 403 when a request is authenticated but not allowed to perform this action -
 * an employee reaching an admin route, for instance.
 *
 * <p>Spring only routes here for a request that already has a real authentication.
 * Anonymous requests go to {@link JwtAuthenticationEntryPoint} and receive 401, which is
 * the distinction the web client depends on: it refreshes its token on 401 and surfaces
 * a 403 as an ordinary error without disturbing the session.
 *
 * <p>The body matches {@code GlobalExceptionHandler}'s AccessDeniedException response,
 * so a denial looks the same to the client whether Spring Security rejected it in the
 * filter chain or a controller threw it.
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;
    private final TimeZoneConfig timeZoneConfig;

    public JwtAccessDeniedHandler(ObjectMapper objectMapper, TimeZoneConfig timeZoneConfig) {
        this.objectMapper = objectMapper;
        this.timeZoneConfig = timeZoneConfig;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now(timeZoneConfig.getZoneId()));
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Forbidden");
        body.put("message", "Access denied");
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getWriter(), body);
    }
}
