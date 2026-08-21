package com.ems.controller;

import com.ems.dto.ProfilePictureRequest;
import com.ems.service.ProfilePictureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-managed profile picture mutations (upload/replace/delete).
 * Base path "/api/admin/users/**" - SecurityConfig already requires
 * hasRole('ADMIN') for this prefix.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfilePictureController {

    private final ProfilePictureService profilePictureService;

    @PutMapping("/{id}/photo")
    public ResponseEntity<Void> setPhoto(@PathVariable Long id, @Valid @RequestBody ProfilePictureRequest request) {
        profilePictureService.setPicture(id, request.getImageBase64());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        profilePictureService.deletePicture(id);
        return ResponseEntity.noContent().build();
    }
}
