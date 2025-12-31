package com.ems.controller;

import com.ems.dto.ScoreRequest;
import com.ems.entity.EmployeeScore;
import com.ems.entity.MiniJobCard;
import com.ems.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * Admin Approval Controller
 * Handles mini job card approvals and performance scoring
 * Base path: /api/admin/approvals
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/approvals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApprovalController {

    private final TicketService ticketService;

    /**
     * Get all pending approvals
     * Shows completed mini job cards awaiting approval
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MiniJobCard entities with COMPLETED status and approved=false
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<MiniJobCard>> getPendingApprovals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("endTime").descending());
        Page<MiniJobCard> pendingApprovals = ticketService.getPendingApprovals(pageable);
        return ResponseEntity.ok(pendingApprovals);
    }

    /**
     * Approve mini job card
     * Marks job card as approved
     * Triggers main ticket status update
     *
     * @param id Mini job card ID
     * @param auth Spring Security authentication
     * @return Updated MiniJobCard
     */
    @PutMapping("/mini-jobs/{id}/approve")
    public ResponseEntity<MiniJobCard> approveMiniJobCard(
            @PathVariable Long id,
            Authentication auth) {

        String approvedBy = auth.getName();
        MiniJobCard approved = ticketService.approveMiniJobCard(id, approvedBy);
        return ResponseEntity.ok(approved);
    }

    /**
     * Reject mini job card
     * Sets status back to ON_HOLD for employee to fix
     * Adds rejection note
     *
     * @param id Mini job card ID
     * @param rejectionNote Reason for rejection
     * @param auth Spring Security authentication
     * @return Updated MiniJobCard
     */
    @PutMapping("/mini-jobs/{id}/reject")
    public ResponseEntity<MiniJobCard> rejectMiniJobCard(
            @PathVariable Long id,
            @RequestParam String rejectionNote,
            Authentication auth) {

        String rejectedBy = auth.getName();
        MiniJobCard rejected = ticketService.rejectMiniJobCard(id, rejectionNote, rejectedBy);
        return ResponseEntity.ok(rejected);
    }

    /**
     * Bulk approve mini job cards
     * Approve multiple job cards at once
     *
     * @param ids List of mini job card IDs
     * @param auth Spring Security authentication
     * @return List of approved MiniJobCard entities
     */
    @PutMapping("/bulk-approve")
    public ResponseEntity<List<MiniJobCard>> bulkApproveMiniJobCards(
            @RequestBody List<Long> ids,
            Authentication auth) {

        String approvedBy = auth.getName();
        List<MiniJobCard> approved = ticketService.bulkApproveMiniJobCards(ids, approvedBy);
        return ResponseEntity.ok(approved);
    }

    /**
     * Assign performance score to employee for a ticket
     * Score is weighted based on ticket weight (1-5)
     * Score range: 1-10
     *
     * @param request ScoreRequest DTO (ticketId, employeeId, score)
     * @param auth Spring Security authentication
     * @return Created EmployeeScore entity
     */
    @PostMapping("/score")
    public ResponseEntity<EmployeeScore> assignScore(
            @Valid @RequestBody ScoreRequest request,
            Authentication auth) {

        String approvedBy = auth.getName();
        EmployeeScore score = ticketService.assignScore(
            request.getTicketId(),
            request.getEmployeeId(),
            request.getScore(),
            approvedBy
        );
        return ResponseEntity.ok(score);
    }

    /**
     * Get all scores for a ticket
     * Shows performance scores for all employees on this ticket
     *
     * @param ticketId Ticket ID
     * @return List of EmployeeScore entities
     */
    @GetMapping("/tickets/{ticketId}/scores")
    public ResponseEntity<List<EmployeeScore>> getScoresByTicket(@PathVariable Long ticketId) {
        List<EmployeeScore> scores = ticketService.getScoresByTicket(ticketId);
        return ResponseEntity.ok(scores);
    }

    /**
     * Get all scores for an employee
     * Shows performance history
     *
     * @param employeeId Employee user ID
     * @return List of EmployeeScore entities
     */
    @GetMapping("/employees/{employeeId}/scores")
    public ResponseEntity<List<EmployeeScore>> getScoresByEmployee(@PathVariable Long employeeId) {
        List<EmployeeScore> scores = ticketService.getScoresByEmployee(employeeId);
        return ResponseEntity.ok(scores);
    }

    /**
     * Update score
     * Modify existing performance score
     *
     * @param scoreId EmployeeScore ID
     * @param newScore New score value (1-10)
     * @param auth Spring Security authentication
     * @return Updated EmployeeScore
     */
    @PutMapping("/scores/{scoreId}")
    public ResponseEntity<EmployeeScore> updateScore(
            @PathVariable Long scoreId,
            @RequestParam int newScore,
            Authentication auth) {

        String updatedBy = auth.getName();
        EmployeeScore score = ticketService.updateScore(scoreId, newScore, updatedBy);
        return ResponseEntity.ok(score);
    }

    /**
     * Delete score
     * Remove performance score entry
     *
     * @param scoreId EmployeeScore ID
     * @return No content
     */
    @DeleteMapping("/scores/{scoreId}")
    public ResponseEntity<Void> deleteScore(@PathVariable Long scoreId) {
        ticketService.deleteScore(scoreId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get approval statistics
     * Shows pending, approved, rejected counts
     *
     * @return Statistics map
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getApprovalStatistics() {
        var stats = ticketService.getApprovalStatistics();
        return ResponseEntity.ok(stats);
    }
}
