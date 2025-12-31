package com.ems.controller;

import com.ems.dto.GeneratorRequest;
import com.ems.dto.MainTicketRequest;
import com.ems.dto.ScoreRequest;
import com.ems.dto.UserRequest;
import com.ems.dto.TimeTrackingReportResponse;
import com.ems.dto.OTReportResponse;
import com.ems.entity.*;
import com.ems.service.GeneratorService;
import com.ems.service.TicketService;
import com.ems.service.UserService;
import com.ems.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private GeneratorService generatorService;
    
    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private ReportService reportService;
    
    // User Management
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@Valid @RequestBody UserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/users")
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }
    
    @GetMapping("/employees")
    public ResponseEntity<Page<User>> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName"));
        return ResponseEntity.ok(userService.getEmployees(pageable));
    }
    
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
    
    // Generator Management
    @PostMapping("/generators")
    public ResponseEntity<Generator> createGenerator(@Valid @RequestBody GeneratorRequest request) {
        return ResponseEntity.ok(generatorService.createGenerator(request));
    }
    
    @GetMapping("/generators")
    public ResponseEntity<Page<Generator>> getAllGenerators(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        return ResponseEntity.ok(generatorService.getAllGenerators(pageable));
    }
    
    @GetMapping("/generators/{id}")
    public ResponseEntity<Generator> getGeneratorById(@PathVariable Long id) {
        return ResponseEntity.ok(generatorService.getGeneratorById(id));
    }
    
    @PutMapping("/generators/{id}")
    public ResponseEntity<Generator> updateGenerator(@PathVariable Long id, @Valid @RequestBody GeneratorRequest request) {
        return ResponseEntity.ok(generatorService.updateGenerator(id, request));
    }
    
    @DeleteMapping("/generators/{id}")
    public ResponseEntity<Void> deleteGenerator(@PathVariable Long id) {
        generatorService.deleteGenerator(id);
        return ResponseEntity.ok().build();
    }
    
    // Ticket Management
    @PostMapping("/tickets")
    public ResponseEntity<MainTicket> createMainTicket(
            @Valid @RequestBody MainTicketRequest request,
            Authentication authentication) {
        String createdBy = authentication.getName();
        return ResponseEntity.ok(ticketService.createMainTicket(request, createdBy));
    }
    
    @GetMapping("/tickets")
    public ResponseEntity<Page<MainTicket>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ticketService.getAllMainTickets(pageable));
    }
    
    @GetMapping("/tickets/{id}")
    public ResponseEntity<MainTicket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getMainTicketById(id));
    }
    
    @GetMapping("/tickets/{id}/mini-jobs")
    public ResponseEntity<List<MiniJobCard>> getMiniJobCards(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getMiniJobCardsByTicketId(id));
    }
    
    // Approval & Scoring
    @PutMapping("/mini-jobs/{id}/approve")
    public ResponseEntity<MiniJobCard> approveMiniJobCard(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.approveMiniJobCard(id));
    }
    
    @PostMapping("/tickets/{ticketId}/score")
    public ResponseEntity<EmployeeScore> assignScore(
            @PathVariable Long ticketId,
            @Valid @RequestBody ScoreRequest request,
            Authentication authentication) {
        EmployeeScore score = ticketService.assignScore(
                ticketId, 
                request.getEmployeeId(), 
                request.getScore(), 
                authentication.getName()
        );
        return ResponseEntity.ok(score);
    }
    
    @GetMapping("/mini-jobs/{id}/logs")
    public ResponseEntity<List<JobStatusLog>> getJobStatusLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getJobStatusLogs(id));
    }
    
    // Reports
    @GetMapping("/reports/time-tracking")
    public ResponseEntity<List<TimeTrackingReportResponse>> getTimeTrackingReport(
            @RequestParam(required = false) Long employeeId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(reportService.getTimeTrackingReport(employeeId, start, end));
    }
    
    @GetMapping("/reports/ot")
    public ResponseEntity<List<OTReportResponse>> getOTReport(
            @RequestParam(required = false) Long employeeId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(reportService.getOTReport(employeeId, start, end));
    }
    
    @GetMapping("/reports/ot-by-generator")
    public ResponseEntity<Map<String, Object>> getOTReportByGenerator(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(reportService.getOTReportByGenerator(start, end));
    }
    
    @GetMapping("/reports/employee-score/{employeeId}")
    public ResponseEntity<Map<String, Object>> getEmployeeScoreReport(@PathVariable Long employeeId) {
        return ResponseEntity.ok(reportService.getEmployeeScoreReport(employeeId));
    }
}
