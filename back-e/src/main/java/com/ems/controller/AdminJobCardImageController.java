package com.ems.controller;

import com.ems.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * On-demand job-card photo access for admins.
 *
 * <p>Job card payloads no longer carry the base64 blob (see MiniJobCard#imageUrl),
 * which is what previously made the approvals list - up to 1000 rows at a time -
 * enormous. Screens that actually render a photo fetch it from here one card at a
 * time.
 *
 * <p>Base path sits under "/api/admin/**", so SecurityConfig's hasRole('ADMIN') rule
 * covers it; the @PreAuthorize below states the same requirement explicitly, matching
 * the other admin controllers.
 */
@RestController
@RequestMapping("/api/admin/job-cards")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobCardImageController {

    private final TicketService ticketService;

    /**
     * @param id Mini job card ID
     * @return {"imageBase64": "data:image/...;base64,..."} or {"imageBase64": null}
     */
    @GetMapping("/{id}/image")
    public ResponseEntity<Map<String, String>> getJobCardImage(@PathVariable Long id) {
        String image = ticketService.getJobCardImage(id).orElse(null);
        Map<String, String> body = new HashMap<>();
        body.put("imageBase64", image);
        return ResponseEntity.ok(body);
    }
}
