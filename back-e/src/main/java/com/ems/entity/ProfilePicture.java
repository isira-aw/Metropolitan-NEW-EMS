package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Stores the avatar/profile picture for a User as a base64-encoded image.
 *
 * Deliberately kept in its own table (not a column on User) so the (potentially
 * large) base64 blob is never embedded in the User entity that gets serialized
 * on every list/search endpoint. Callers should only hit this table when they
 * actually need to render a photo - see User#hasProfilePicture for a cheap flag
 * that lets list views decide whether it's worth fetching at all.
 */
@Entity
@Table(name = "profile_pictures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfilePicture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String imageBase64;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
