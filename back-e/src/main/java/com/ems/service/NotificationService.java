package com.ems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;
    private final WhatsAppService whatsAppService;

    public void sendPasswordResetNotification(String email, String phone, String resetToken, String resetUrl) {
        // Send via email if provided
        if (email != null && !email.isEmpty()) {
            try {
                emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
            } catch (Exception e) {
                log.error("Failed to send password reset email to: {}", email, e);
            }
        }

        // Send via WhatsApp if provided
        if (phone != null && !phone.isEmpty()) {
            try {
                whatsAppService.sendPasswordResetWhatsApp(phone, resetToken, resetUrl);
            } catch (Exception e) {
                log.error("Failed to send password reset WhatsApp to: {}", phone, e);
            }
        }
    }

    public void sendTicketCompletionNotification(String email, String phone, String ticketNumber,
                                                  String generatorName, String summary) {
        // Send via email if provided
        if (email != null && !email.isEmpty()) {
            try {
                emailService.sendTicketCompletionEmail(email, ticketNumber, generatorName, summary);
            } catch (Exception e) {
                log.error("Failed to send ticket completion email to: {}", email, e);
            }
        }

        // Send via WhatsApp if provided
        if (phone != null && !phone.isEmpty()) {
            try {
                whatsAppService.sendTicketCompletionWhatsApp(phone, ticketNumber, generatorName, summary);
            } catch (Exception e) {
                log.error("Failed to send ticket completion WhatsApp to: {}", phone, e);
            }
        }
    }
}
