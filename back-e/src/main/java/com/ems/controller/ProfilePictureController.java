package com.ems.controller;

import com.ems.dto.ProfilePictureResponse;
import com.ems.service.ProfilePictureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only profile picture access, open to any authenticated user (ADMIN or
 * EMPLOYEE) for any user id - covers an admin viewing an employee's avatar,
 * an employee's own sidebar avatar, and personnel-assignment avatars.
 *
 * Base path "/api/users/**" is not under "/api/admin/**" or "/api/employee/**",
 * so SecurityConfig's anyRequest().authenticated() rule is what protects it -
 * no extra @PreAuthorize needed here.
 *
 * Admin-only mutation (upload/replace/delete) lives in
 * AdminProfilePictureController under "/api/admin/users/**" instead, so the
 * existing hasRole('ADMIN') rule for that prefix covers it.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfilePictureController {

    private final ProfilePictureService profilePictureService;

    @GetMapping("/{id}/photo")
    public ResponseEntity<ProfilePictureResponse> getPhoto(@PathVariable Long id) {
        return profilePictureService.getImageBase64(id)
                .map(image -> ResponseEntity.ok(new ProfilePictureResponse(image)))
                .orElseGet(() -> ResponseEntity.ok(new ProfilePictureResponse(null)));
    }

    /**
     * Own-photo lookup for the logged-in user, resolved from the JWT username -
     * used by the sidebar avatar, which doesn't have the user's id client-side.
     */
    @GetMapping("/me/photo")
    public ResponseEntity<ProfilePictureResponse> getMyPhoto(Authentication auth) {
        return profilePictureService.getOwnImageBase64(auth.getName())
                .map(image -> ResponseEntity.ok(new ProfilePictureResponse(image)))
                .orElseGet(() -> ResponseEntity.ok(new ProfilePictureResponse(null)));
    }
}
