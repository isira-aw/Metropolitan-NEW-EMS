package com.ems.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Throttles the unauthenticated endpoints: login, password-reset request, and
 * password-reset token validation/use.
 *
 * <p>These are the only routes reachable without a token, and all three were
 * previously unthrottled. That made login brute-forceable and let anyone drive an
 * unbounded number of password-reset requests, each of which sends a real email via
 * SES and a real WhatsApp message - a direct cost, and a fast route to getting the
 * SES sending identity suspended for bounces.
 *
 * <p>Implemented as a fixed-size sliding window per client IP, held in memory with no
 * new dependency. Two consequences worth knowing:
 * <ul>
 *   <li>The counter is per JVM, so with multiple backend instances the effective
 *       limit is (limit x instances). It still bounds the damage by orders of
 *       magnitude; a shared store (Redis) would be needed for an exact global limit.</li>
 *   <li>Clients behind one NAT/proxy share a bucket. The limits below are set well
 *       above what a human does by hand for that reason.</li>
 * </ul>
 *
 * <p>Set {@code app.rate-limit.enabled=false} to disable (useful for load tests).
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    /** Login: generous for a human, useless for a brute-force run. */
    private static final int LOGIN_MAX_REQUESTS = 10;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(1);

    /** Password reset request: sends email + WhatsApp, so it is kept tight. */
    private static final int RESET_REQUEST_MAX_REQUESTS = 5;
    private static final Duration RESET_REQUEST_WINDOW = Duration.ofMinutes(15);

    /** Token validation/use: no outbound cost, but guessing tokens should be slow. */
    private static final int RESET_USE_MAX_REQUESTS = 20;
    private static final Duration RESET_USE_WINDOW = Duration.ofMinutes(15);

    /**
     * Safety valve so a flood of unique source addresses cannot grow the map without
     * bound. Well above any realistic number of concurrent clients; when exceeded the
     * map is cleared and counting restarts.
     */
    private static final int MAX_TRACKED_CLIENTS = 50_000;

    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        int limit;
        Duration window;
        String bucket;

        if ("POST".equals(method) && path.endsWith("/api/auth/login")) {
            limit = LOGIN_MAX_REQUESTS;
            window = LOGIN_WINDOW;
            bucket = "login";
        } else if ("POST".equals(method) && path.endsWith("/api/password-reset/forgot-password")) {
            limit = RESET_REQUEST_MAX_REQUESTS;
            window = RESET_REQUEST_WINDOW;
            bucket = "reset-request";
        } else if (path.startsWith("/api/password-reset/")) {
            limit = RESET_USE_MAX_REQUESTS;
            window = RESET_USE_WINDOW;
            bucket = "reset-use";
        } else {
            filterChain.doFilter(request, response);
            return;
        }

        String key = bucket + ":" + clientIp(request);

        if (exceedsLimit(key, limit, window)) {
            // Deliberately vague: no indication of which account or token was involved.
            log.warn("Rate limit hit for bucket {} from {}", bucket, clientIp(request));
            writeTooManyRequests(response, window);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean exceedsLimit(String key, int limit, Duration window) {
        if (hits.size() > MAX_TRACKED_CLIENTS) {
            hits.clear();
        }

        Instant now = Instant.now();
        Instant cutoff = now.minus(window);

        Deque<Instant> timestamps = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= limit) {
                return true;
            }
            timestamps.addLast(now);
            return false;
        }
    }

    /**
     * Prefers the left-most X-Forwarded-For entry because the app runs behind
     * Railway's proxy, where the socket address is the proxy rather than the client.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response, Duration window) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(window.toSeconds()));

        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", "Too Many Requests");
        body.put("message", "Too many attempts. Please wait a few minutes and try again.");

        objectMapper.writeValue(response.getWriter(), body);
    }
}
