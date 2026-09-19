package com.ems.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                // Expected on every expired/invalid token (routine, happens on every
                // access-token expiry for every logged-in user) - not an application
                // error, so keep it at debug to avoid flooding production logs.
                logger.debug("JWT token extraction failed: " + e.getMessage());
            }
        }
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(token, username)) {
                String role = jwtUtil.extractRole(token);

                // Only an access token carries a role claim; a refresh token does not
                // (see JwtUtil.generateRefreshToken). Without this check a refresh
                // token presented as a Bearer token authenticated successfully with
                // the authority "ROLE_null", which satisfies no role rule and no
                // ownership check - so every protected call returned 403. That is a
                // token problem, and 403 is the one status the client will not
                // refresh or sign out on, leaving the user stuck. Leaving the request
                // unauthenticated instead routes it to JwtAuthenticationEntryPoint,
                // which answers 401 so the client can renew or send them to sign in.
                if (role != null && !role.isBlank()) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    logger.debug("Token has no role claim - treating as unauthenticated");
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
