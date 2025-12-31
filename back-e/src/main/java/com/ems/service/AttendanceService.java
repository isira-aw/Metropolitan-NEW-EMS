package com.ems.service;

import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.User;
import com.ems.repository.EmployeeDayAttendanceRepository;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
public class AttendanceService {
    
    @Autowired
    private EmployeeDayAttendanceRepository attendanceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
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
}
