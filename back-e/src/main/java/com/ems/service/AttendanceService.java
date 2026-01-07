package com.ems.service;

import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.JobStatus;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import com.ems.repository.EmployeeDayAttendanceRepository;
import com.ems.repository.MiniJobCardRepository;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private EmployeeDayAttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    private static final LocalTime MORNING_OT_CUTOFF = LocalTime.of(8, 30);
    private static final LocalTime EVENING_OT_CUTOFF = LocalTime.of(17, 30);
    
    public EmployeeDayAttendance startDay(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
        
        String uniqueKey = employee.getId() + "-" + today;
        
        // Check if already started
        if (attendanceRepository.findByUniqueKey(uniqueKey).isPresent()) {
            throw new RuntimeException("Day already started");
        }
        
        EmployeeDayAttendance attendance = new EmployeeDayAttendance();
        attendance.setEmployee(employee);
        attendance.setDate(today);
        attendance.setDayStartTime(now);
        attendance.setUniqueKey(uniqueKey);
        
        // Calculate morning OT
        if (now.toLocalTime().isBefore(MORNING_OT_CUTOFF)) {
            long morningOtMinutes = Duration.between(now.toLocalTime(), MORNING_OT_CUTOFF).toMinutes();
            attendance.setMorningOtMinutes((int) morningOtMinutes);
        }
        
        return attendanceRepository.save(attendance);
    }
    
    public EmployeeDayAttendance endDay(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Colombo"));

        EmployeeDayAttendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new RuntimeException("Day not started yet"));

        if (attendance.getDayEndTime() != null) {
            throw new RuntimeException("Day already ended");
        }

        // Day Closure Restriction: Check for open tickets scheduled for today
        List<MiniJobCard> allEmployeeCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();
        List<MiniJobCard> openTicketsForToday = allEmployeeCards.stream()
                .filter(card -> card.getMainTicket().getScheduledDate().equals(today))
                .filter(card -> card.getStatus() != JobStatus.COMPLETED && card.getStatus() != JobStatus.CANCEL)
                .collect(Collectors.toList());

        if (!openTicketsForToday.isEmpty()) {
            String ticketNumbers = openTicketsForToday.stream()
                    .map(card -> card.getMainTicket().getTicketNumber())
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new RuntimeException("Cannot end workday. You have " + openTicketsForToday.size() +
                    " open ticket(s) scheduled for today: " + ticketNumbers +
                    ". Please complete or cancel all tickets before ending your workday.");
        }

        attendance.setDayEndTime(now);

        // Calculate evening OT
        if (now.toLocalTime().isAfter(EVENING_OT_CUTOFF)) {
            long eveningOtMinutes = Duration.between(EVENING_OT_CUTOFF, now.toLocalTime()).toMinutes();
            attendance.setEveningOtMinutes((int) eveningOtMinutes);
        }

        return attendanceRepository.save(attendance);
    }
    
    public boolean hasDayStarted(User employee) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        return attendanceRepository.findByEmployeeAndDate(employee, today).isPresent();
    }
    
    public boolean hasDayEnded(User employee) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        return attendanceRepository.findByEmployeeAndDate(employee, today)
                .map(attendance -> attendance.getDayEndTime() != null)
                .orElse(false);
    }
    
    public EmployeeDayAttendance getTodayAttendance(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        return attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElse(null);
    }

    public Page<EmployeeDayAttendance> getAttendanceHistory(String username, Pageable pageable) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get all attendance records and paginate manually
        // In a real implementation, you would create a repository method with Pageable
        List<EmployeeDayAttendance> allAttendance = attendanceRepository.findByEmployeeAndDateBetween(
            employee,
            LocalDate.of(2000, 1, 1),
            LocalDate.now(ZoneId.of("Asia/Colombo"))
        );

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allAttendance.size());

        List<EmployeeDayAttendance> pageContent = start >= allAttendance.size()
            ? List.of()
            : allAttendance.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allAttendance.size());
    }

    public List<EmployeeDayAttendance> getAttendanceByDateRange(
            String username,
            LocalDate startDate,
            LocalDate endDate) {

        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
    }
}
