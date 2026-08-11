package com.ems.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;
import software.amazon.awssdk.services.ses.model.SendEmailResponse;
import software.amazon.awssdk.services.ses.model.SesException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the SES-backed EmailService, using a mocked SesClient so no
 * real email is ever sent as part of the test suite.
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private SesClient sesClient;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(sesClient);
        ReflectionTestUtils.setField(emailService, "fromEmail", "sender@example.com");
    }

    @Test
    void sendEmail_success_callsSesWithExpectedFields() {
        when(sesClient.sendEmail(any(SendEmailRequest.class)))
                .thenReturn(SendEmailResponse.builder().messageId("test-message-id").build());

        emailService.sendEmail("recipient@example.com", "Subject", "Body text");

        ArgumentCaptor<SendEmailRequest> captor = ArgumentCaptor.forClass(SendEmailRequest.class);
        verify(sesClient).sendEmail(captor.capture());

        SendEmailRequest request = captor.getValue();
        assertThat(request.source()).isEqualTo("sender@example.com");
        assertThat(request.destination().toAddresses()).containsExactly("recipient@example.com");
        assertThat(request.message().subject().data()).isEqualTo("Subject");
        assertThat(request.message().body().text().data()).isEqualTo("Body text");
    }

    @Test
    void sendEmail_sesFailure_wrapsAsRuntimeExceptionAndDoesNotSwallowIt() {
        when(sesClient.sendEmail(any(SendEmailRequest.class)))
                .thenThrow(SesException.builder().message("SES rejected the request").build());

        assertThatThrownBy(() -> emailService.sendEmail("recipient@example.com", "Subject", "Body"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to send email");
    }

    @Test
    void sendPasswordResetEmail_includesResetLinkAndToken() {
        when(sesClient.sendEmail(any(SendEmailRequest.class)))
                .thenReturn(SendEmailResponse.builder().messageId("test-message-id").build());

        emailService.sendPasswordResetEmail("recipient@example.com", "abc123", "https://app.example.com");

        ArgumentCaptor<SendEmailRequest> captor = ArgumentCaptor.forClass(SendEmailRequest.class);
        verify(sesClient).sendEmail(captor.capture());

        String body = captor.getValue().message().body().text().data();
        assertThat(body).contains("https://app.example.com/reset-password?token=abc123");
    }

    @Test
    void sendTicketCompletionEmail_sesFailure_propagatesAsRuntimeException() {
        // NotificationService relies on this still surfacing as a RuntimeException
        // so its existing try/catch keeps swallowing send failures without crashing
        // the caller (e.g. ticket completion flow).
        when(sesClient.sendEmail(any(SendEmailRequest.class)))
                .thenThrow(SesException.builder().message("throttled").build());

        assertThatThrownBy(() ->
                emailService.sendTicketCompletionEmail("owner@example.com", "TCK-1", "Generator A", "All done"))
                .isInstanceOf(RuntimeException.class);
    }
}
