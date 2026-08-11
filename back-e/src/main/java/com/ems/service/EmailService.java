package com.ems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;
import software.amazon.awssdk.services.ses.model.SesException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SesClient sesClient;

    @Value("${aws.ses.sender-email}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder().text(Content.builder().data(body).build()).build())
                            .build())
                    .build();

            sesClient.sendEmail(request);
            log.info("Email sent successfully to: {}", to);
        } catch (SesException e) {
            log.error("Failed to send email to: {}. Error: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String resetToken, String resetUrl) {
        String subject = "Password Reset Request - Metropolitan EMS";
        String body = String.format(
            "Hello,\n\n" +
            "We received a request to reset your password for your Metropolitan EMS account.\n\n" +
            "Click the link below to reset your password:\n" +
            "%s/reset-password?token=%s\n\n" +
            "This link will expire in 15 minutes.\n\n" +
            "If you did not request a password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            resetUrl, resetToken
        );

        sendEmail(to, subject, body);
    }

    public void sendTicketCompletionEmail(String to, String ticketNumber, String generatorName, String summary) {
        String subject = "Ticket Completed - " + ticketNumber;
        String body = String.format(
            "Dear Generator Owner,\n\n" +
            "We are pleased to inform you that the service ticket for your generator has been completed.\n\n" +
            "Ticket Reference: %s\n" +
            "Generator: %s\n" +
            "Status: COMPLETED\n\n" +
            "Summary:\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            ticketNumber, generatorName, summary
        );

        sendEmail(to, subject, body);
    }

    public void sendCustomEmail(String to, String ticketNumber, String generatorName, String customMessage) {
        String subject = "Service Update - Ticket " + ticketNumber;
        String body = String.format(
            "Dear Generator Owner,\n\n" +
            "This is an update regarding your service ticket.\n\n" +
            "Ticket Reference: %s\n" +
            "Generator: %s\n\n" +
            "Message:\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            ticketNumber, generatorName, customMessage
        );

        sendEmail(to, subject, body);
    }
}
