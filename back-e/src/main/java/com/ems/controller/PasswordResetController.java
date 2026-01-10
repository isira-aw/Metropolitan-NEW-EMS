package com.ems.controller;

import com.ems.dto.ForgotPasswordRequest;
import com.ems.dto.ResetPasswordRequest;
import com.ems.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/password-reset")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.requestPasswordReset(request.getEmailOrPhone());
            // Always return success message to prevent user enumeration
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email or phone, a password reset link has been sent."
            ));
        } catch (Exception e) {
            log.error("Error processing forgot password request", e);
            // Return generic success message to prevent user enumeration
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email or phone, a password reset link has been sent."
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of(
                    "message", "Password has been reset successfully. You can now login with your new password."
            ));
        } catch (Exception e) {
            log.error("Error resetting password", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            passwordResetService.validateToken(token);
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "message", "Token is valid"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", e.getMessage()
            ));
        }
    }
}
