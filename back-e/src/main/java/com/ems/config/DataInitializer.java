package com.ems.config;

import com.ems.entity.User;
import com.ems.entity.UserRole;
import com.ems.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds default admin/employee accounts for local development only.
 * Never runs against a real deployment - production environments must
 * create their own accounts and set JWT_SECRET/SPRING_DATASOURCE_PASSWORD
 * to values that were never used for a dev seed.
 */
@Component
@Profile({"dev", "local"})
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default admin if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("System Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setEmail("admin@ems.com");
            admin.setActive(true);
            userRepository.save(admin);
            log.info("Default dev admin account created (username: admin)");
        }

        // Create default employee if not exists
        if (!userRepository.existsByUsername("employee")) {
            User employee = new User();
            employee.setUsername("employee");
            employee.setPassword(passwordEncoder.encode("emp123"));
            employee.setFullName("Test Employee");
            employee.setRole(UserRole.EMPLOYEE);
            employee.setEmail("employee@ems.com");
            employee.setActive(true);
            userRepository.save(employee);
            log.info("Default dev employee account created (username: employee)");
        }
    }
}
