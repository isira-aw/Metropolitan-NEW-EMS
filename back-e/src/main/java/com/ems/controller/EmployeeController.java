package com.ems.controller;

import com.ems.dto.StatusUpdateRequest;
import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import com.ems.repository.MiniJobCardRepository;
import com.ems.repository.UserRepository;
import com.ems.service.AttendanceService;
import com.ems.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EmployeeController {
    
    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Day Management
    @PostMapping("/day/start")
    public ResponseEntity<EmployeeDayAttendance> startDay(Authentication authentication) {
        try {
            EmployeeDayAttendance attendance = attendanceService.startDay(authentication.getName());
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/day/end")
    public ResponseEntity<EmployeeDayAttendance> endDay(Authentication authentication) {
        try {
            EmployeeDayAttendance attendance = attendanceService.endDay(authentication.getName());
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/day/status")
    public ResponseEntity<EmployeeDayAttendance> getDayStatus(Authentication authentication) {
        EmployeeDayAttendance attendance = attendanceService.getTodayAttendance(authentication.getName());
        return ResponseEntity.ok(attendance);
    }
    
    // Job Card Management
    @GetMapping("/job-cards")
    public ResponseEntity<Page<MiniJobCard>> getMyJobCards(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User employee = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(miniJobCardRepository.findByEmployee(employee, pageable));
    }
    
    @GetMapping("/job-cards/{id}")
    public ResponseEntity<MiniJobCard> getJobCardById(
            @PathVariable Long id,
            Authentication authentication) {
        
        MiniJobCard jobCard = miniJobCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job card not found"));
        
        User employee = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        if (!jobCard.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(jobCard);
    }
    
    @PutMapping("/job-cards/{id}/status")
    public ResponseEntity<MiniJobCard> updateJobStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        try {
            MiniJobCard updated = ticketService.updateJobStatus(id, request, authentication.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
