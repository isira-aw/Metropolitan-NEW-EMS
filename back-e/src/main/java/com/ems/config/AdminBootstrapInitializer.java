package com.ems.config;

import com.ems.entity.User;
import com.ems.entity.UserRole;
import com.ems.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Guarantees there is always at least one working admin login, including in production
 * where {@link DataInitializer} is disabled. Runs in every profile but only ever creates
 * an account when no ADMIN exists yet - it never touches an existing admin. Credentials
 * come from env vars only; if they are not set, seeding is skipped (with a warning) rather
 * than falling back to an insecure default in production.
 */
@Component
@Slf4j
public class AdminBootstrapInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${bootstrap.admin.username:}")
    private String bootstrapUsername;

    @Value("${bootstrap.admin.password:}")
    private String bootstrapPassword;

    @Value("${bootstrap.admin.email:}")
    private String bootstrapEmail;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        if (bootstrapUsername.isBlank() || bootstrapPassword.isBlank()) {
            log.warn("No admin account exists and BOOTSTRAP_ADMIN_USERNAME/BOOTSTRAP_ADMIN_PASSWORD "
                    + "are not set - skipping admin bootstrap. Set both env vars and restart to create one.");
            return;
        }

        User admin = new User();
        admin.setUsername(bootstrapUsername);
        admin.setPassword(passwordEncoder.encode(bootstrapPassword));
        admin.setFullName("System Administrator");
        admin.setRole(UserRole.ADMIN);
        admin.setEmail(bootstrapEmail.isBlank() ? null : bootstrapEmail);
        admin.setActive(true);
        admin.setProtectedAccount(true);
        userRepository.save(admin);
        log.info("Bootstrapped protected admin account (username: {})", bootstrapUsername);
    }
}
