package com.ems.controller;

import com.ems.dto.StatusUpdateRequest;
import com.ems.entity.JobStatusLog;
import com.ems.entity.MiniJobCard;
import com.ems.service.FileStorageService;
import com.ems.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Employee Job Card Controller
 * Handles mini job card operations for employees
 * Base path: /api/employee/job-cards
 * Security: EMPLOYEE role required
 */
@RestController
@RequestMapping("/api/employee/job-cards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeJobCardController {

    private final TicketService ticketService;
    private final FileStorageService fileStorageService;

    /**
     * Get all job cards assigned to current employee
     * Paginated and sorted by creation date descending
     *
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MiniJobCard records
     */
    @GetMapping
    public ResponseEntity<Page<MiniJobCard>> getMyJobCards(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MiniJobCard> jobCards = ticketService.getJobCardsByEmployee(username, pageable);
        return ResponseEntity.ok(jobCards);
    }

    /**
     * Get specific job card by ID
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param auth Spring Security authentication
     * @return MiniJobCard details
     */
    @GetMapping("/{id}")
    public ResponseEntity<MiniJobCard> getJobCardById(
            @PathVariable Long id,
            Authentication auth) {

        String username = auth.getName();
        MiniJobCard jobCard = ticketService.getJobCardByIdForEmployee(id, username);
        return ResponseEntity.ok(jobCard);
    }

    /**
     * Update job card status
     * Creates audit log with geolocation
     * Validates status transition rules
     * Calculates work minutes
     *
     * @param id Mini job card ID
     * @param request Status update request (newStatus, latitude, longitude)
     * @param auth Spring Security authentication
     * @return Updated MiniJobCard
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<MiniJobCard> updateJobCardStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication auth) {

        String username = auth.getName();
        MiniJobCard updated = ticketService.updateJobStatus(id, request, username);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get status logs for a job card
     * Shows complete audit trail with geolocation
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param auth Spring Security authentication
     * @return List of JobStatusLog records ordered by time
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<JobStatusLog>> getJobCardLogs(
            @PathVariable Long id,
            Authentication auth) {

        String username = auth.getName();
        // First validate employee owns this job card
        ticketService.getJobCardByIdForEmployee(id, username);

        // Then get logs
        List<JobStatusLog> logs = ticketService.getJobStatusLogs(id);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get job cards by status
     * Useful for filtering pending, in-progress, or completed jobs
     *
     * @param status Job status filter
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of filtered MiniJobCard records
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<MiniJobCard>> getJobCardsByStatus(
            @PathVariable String status,
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MiniJobCard> jobCards = ticketService.getJobCardsByEmployeeAndStatus(username, status, pageable);
        return ResponseEntity.ok(jobCards);
    }

    /**
     * Get pending job cards count
     * Quick endpoint for badge notifications
     *
     * @param auth Spring Security authentication
     * @return Count of pending job cards
     */
    @GetMapping("/pending/count")
    public ResponseEntity<Long> getPendingCount(Authentication auth) {
        String username = auth.getName();
        Long count = ticketService.getPendingJobCardsCount(username);
        return ResponseEntity.ok(count);
    }

    /**
     * Upload image for a job card
     * Only one image per job card is allowed
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param file Image file to upload
     * @param auth Spring Security authentication
     * @return Success response with image URL
     */
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        String username = auth.getName();

        // Validate employee owns this job card
        MiniJobCard jobCard = ticketService.getJobCardByIdForEmployee(id, username);

        // Delete old image if exists
        if (jobCard.getImageUrl() != null && !jobCard.getImageUrl().isEmpty()) {
            fileStorageService.deleteFile(jobCard.getImageUrl());
        }

        // Store new image
        String filename = fileStorageService.storeFile(file);

        // Update job card with new image URL
        ticketService.updateJobCardImage(id, filename);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Image uploaded successfully");
        response.put("imageUrl", filename);

        return ResponseEntity.ok(response);
    }

    /**
     * Get image for a job card
     * Publicly accessible to allow admin viewing
     *
     * @param filename Image filename
     * @return Image file as resource
     */
    @GetMapping("/images/{filename:.+}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.loadFile(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
