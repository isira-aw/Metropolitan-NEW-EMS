package com.ems.service;

import com.ems.dto.MainTicketRequest;
import com.ems.dto.StatusUpdateRequest;
import com.ems.entity.*;
import com.ems.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {
    
    @Autowired
    private MainTicketRepository mainTicketRepository;
    
    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    @Autowired
    private TicketAssignmentRepository ticketAssignmentRepository;
    
    @Autowired
    private JobStatusLogRepository jobStatusLogRepository;
    
    @Autowired
    private GeneratorRepository generatorRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private EmployeeScoreRepository employeeScoreRepository;
    
    @Transactional
    public MainTicket createMainTicket(MainTicketRequest request, String createdBy) {
        Generator generator = generatorRepository.findById(request.getGeneratorId())
                .orElseThrow(() -> new RuntimeException("Generator not found"));
        
        MainTicket mainTicket = new MainTicket();
        mainTicket.setTicketNumber("TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        mainTicket.setGenerator(generator);
        mainTicket.setTitle(request.getTitle());
        mainTicket.setDescription(request.getDescription());
        mainTicket.setType(request.getType());
        mainTicket.setWeight(request.getWeight());
        mainTicket.setScheduledDate(request.getScheduledDate());
        mainTicket.setScheduledTime(request.getScheduledTime());
        mainTicket.setCreatedBy(createdBy);
        mainTicket.setStatus(JobStatus.PENDING);
        
        mainTicket = mainTicketRepository.save(mainTicket);
        
        for (Long employeeId : request.getEmployeeIds()) {
            User employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
            
            if (employee.getRole() != UserRole.EMPLOYEE) {
                throw new RuntimeException("User " + employee.getUsername() + " is not an employee");
            }
            
            TicketAssignment assignment = new TicketAssignment();
            assignment.setMainTicket(mainTicket);
            assignment.setEmployee(employee);
            ticketAssignmentRepository.save(assignment);
            
            MiniJobCard miniJobCard = new MiniJobCard();
            miniJobCard.setMainTicket(mainTicket);
            miniJobCard.setEmployee(employee);
            miniJobCard.setStatus(JobStatus.PENDING);
            miniJobCard.setApproved(false);
            miniJobCard.setWorkMinutes(0);
            miniJobCardRepository.save(miniJobCard);
        }
        
        return mainTicket;
    }
    
    public Page<MainTicket> getAllMainTickets(Pageable pageable) {
        return mainTicketRepository.findAll(pageable);
    }
    
    public MainTicket getMainTicketById(Long id) {
        return mainTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));
    }
    
    public List<MiniJobCard> getMiniJobCardsByTicketId(Long mainTicketId) {
        return miniJobCardRepository.findByMainTicketId(mainTicketId);
    }
    
    @Transactional
    public MiniJobCard updateJobStatus(Long miniJobCardId, StatusUpdateRequest request, String employeeUsername) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));
        
        User employee = userRepository.findByUsername(employeeUsername)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        if (!miniJobCard.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("Unauthorized: This job card doesn't belong to you");
        }
        
        if (!attendanceService.hasDayStarted(employee)) {
            throw new RuntimeException("Please start your day first");
        }
        
        if (attendanceService.hasDayEnded(employee)) {
            throw new RuntimeException("Cannot update status after day has ended");
        }
        
        validateStatusTransition(miniJobCard.getStatus(), request.getNewStatus());
        
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
        
        JobStatusLog log = new JobStatusLog();
        log.setMiniJobCard(miniJobCard);
        log.setEmployeeEmail(employee.getEmail());
        log.setPrevStatus(miniJobCard.getStatus());
        log.setNewStatus(request.getNewStatus());
        log.setLatitude(request.getLatitude());
        log.setLongitude(request.getLongitude());
        log.setLoggedAt(now);
        jobStatusLogRepository.save(log);
        
        miniJobCard.setStatus(request.getNewStatus());
        
        if (request.getNewStatus() == JobStatus.STARTED && miniJobCard.getStartTime() == null) {
            miniJobCard.setStartTime(now);
        }
        
        if (request.getNewStatus() == JobStatus.COMPLETED && miniJobCard.getEndTime() == null) {
            miniJobCard.setEndTime(now);
            calculateWorkMinutes(miniJobCard);
        }
        
        miniJobCard = miniJobCardRepository.save(miniJobCard);
        updateMainTicketStatus(miniJobCard.getMainTicket().getId());
        
        return miniJobCard;
    }
    
    private void calculateWorkMinutes(MiniJobCard miniJobCard) {
        List<JobStatusLog> logs = jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(miniJobCard.getId());
        
        int totalWorkMinutes = 0;
        LocalDateTime startedTime = null;
        
        for (int i = logs.size() - 1; i >= 0; i--) {
            JobStatusLog log = logs.get(i);
            
            if (log.getNewStatus() == JobStatus.STARTED) {
                startedTime = log.getLoggedAt();
            } else if ((log.getNewStatus() == JobStatus.ON_HOLD || log.getNewStatus() == JobStatus.COMPLETED) && startedTime != null) {
                long minutes = Duration.between(startedTime, log.getLoggedAt()).toMinutes();
                totalWorkMinutes += minutes;
                startedTime = null;
            }
        }
        
        miniJobCard.setWorkMinutes(totalWorkMinutes);
    }
    
    private void updateMainTicketStatus(Long mainTicketId) {
        List<MiniJobCard> miniJobCards = miniJobCardRepository.findByMainTicketId(mainTicketId);
        MainTicket mainTicket = mainTicketRepository.findById(mainTicketId)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));
        
        boolean allCompleted = miniJobCards.stream()
                .allMatch(mjc -> mjc.getStatus() == JobStatus.COMPLETED || mjc.getStatus() == JobStatus.CANCEL);
        
        boolean anyStarted = miniJobCards.stream()
                .anyMatch(mjc -> mjc.getStatus() == JobStatus.STARTED || 
                                mjc.getStatus() == JobStatus.TRAVELING ||
                                mjc.getStatus() == JobStatus.ON_HOLD);
        
        if (allCompleted) {
            mainTicket.setStatus(JobStatus.COMPLETED);
        } else if (anyStarted) {
            mainTicket.setStatus(JobStatus.STARTED);
        }
        
        mainTicketRepository.save(mainTicket);
    }
    
    private void validateStatusTransition(JobStatus current, JobStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == JobStatus.TRAVELING || next == JobStatus.CANCEL;
            case TRAVELING -> next == JobStatus.STARTED || next == JobStatus.ON_HOLD || next == JobStatus.CANCEL;
            case STARTED -> next == JobStatus.ON_HOLD || next == JobStatus.COMPLETED || next == JobStatus.CANCEL;
            case ON_HOLD -> next == JobStatus.STARTED || next == JobStatus.CANCEL;
            case COMPLETED, CANCEL -> false;
        };
        
        if (!valid) {
            throw new RuntimeException("Invalid status transition from " + current + " to " + next);
        }
    }
    
    @Transactional
    public MiniJobCard approveMiniJobCard(Long miniJobCardId) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));
        
        if (miniJobCard.getStatus() != JobStatus.COMPLETED) {
            throw new RuntimeException("Can only approve completed job cards");
        }
        
        miniJobCard.setApproved(true);
        return miniJobCardRepository.save(miniJobCard);
    }
    
    @Transactional
    public EmployeeScore assignScore(Long mainTicketId, Long employeeId, Integer score, String adminUsername) {
        MainTicket mainTicket = mainTicketRepository.findById(mainTicketId)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));
        
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        List<MiniJobCard> miniJobCards = miniJobCardRepository.findByMainTicketId(mainTicketId);
        boolean isAssigned = miniJobCards.stream()
                .anyMatch(mjc -> mjc.getEmployee().getId().equals(employeeId));
        
        if (!isAssigned) {
            throw new RuntimeException("Employee was not assigned to this ticket");
        }
        
        List<EmployeeScore> existingScores = employeeScoreRepository.findByMainTicketId(mainTicketId);
        EmployeeScore employeeScore = existingScores.stream()
                .filter(es -> es.getEmployee().getId().equals(employeeId))
                .findFirst()
                .orElse(new EmployeeScore());
        
        employeeScore.setEmployee(employee);
        employeeScore.setMainTicket(mainTicket);
        employeeScore.setWeight(mainTicket.getWeight());
        employeeScore.setScore(score);
        employeeScore.setApprovedBy(adminUsername);
        employeeScore.setApprovedAt(LocalDateTime.now(ZoneId.of("Asia/Colombo")));
        
        return employeeScoreRepository.save(employeeScore);
    }
    
    public List<JobStatusLog> getJobStatusLogs(Long miniJobCardId) {
        return jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(miniJobCardId);
    }
}
