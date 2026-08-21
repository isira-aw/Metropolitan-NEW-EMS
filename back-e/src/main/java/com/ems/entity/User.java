package com.ems.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @JsonIgnore
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String fullName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    private String phone;
    
    @Column(unique = true)
    private String email;
    
    @Column(nullable = false)
    private Boolean active = true;

    // System-seeded admin accounts (see AdminBootstrapInitializer) that can never be
    // deactivated, demoted, or have their role changed via the admin API - guarantees
    // there is always at least one working admin login.
    @Column(name = "protected_account", nullable = false)
    private Boolean protectedAccount = false;

    // Denormalized flag kept in sync whenever a ProfilePicture is set/removed
    // (see ProfilePictureService), so list views can tell whether it's worth
    // fetching an avatar for this user without ever loading the base64 blob.
    // columnDefinition supplies a DEFAULT so ddl-auto=update can add this
    // NOT NULL column to the existing (non-empty) users table in production -
    // a plain "not null" ADD COLUMN with no default fails against existing rows.
    @Column(name = "has_profile_picture", nullable = false, columnDefinition = "boolean not null default false")
    private Boolean hasProfilePicture = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
