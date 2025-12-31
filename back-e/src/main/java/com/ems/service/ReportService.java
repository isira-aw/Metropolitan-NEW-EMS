package com.ems.service;

import com.ems.dto.OTReportResponse;
import com.ems.dto.TimeTrackingReportResponse;
import com.ems.entity.*;
import com.ems.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {
    
    @Autowired
    private EmployeeDayAttendanceRepository attendanceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    @Autowired
    private JobStatusLogRepository jobStatusLogRepository;
    
    public List<TimeTrackingReportResponse> getTimeTrackingReport(Long employeeId, LocalDate startDate, LocalDate endDate) {
        User employee = null;
        if (employeeId != null) {
            employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
        }
        
        List<EmployeeDayAttendance> attendances;
        if (employee != null) {
            attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
        } else {
            // Get all employees' attendance
            attendances = new ArrayList<>();
            List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
            for (User emp : employees) {
                attendances.addAll(attendanceRepository.findByEmployeeAndDateBetween(emp, startDate, endDate));
            }
        }
        
        List<TimeTrackingReportResponse> reports = new ArrayList<>();
        
        for (EmployeeDayAttendance attendance : attendances) {
            TimeTrackingReportResponse report = new TimeTrackingReportResponse();
            report.setEmployeeName(attendance.getEmployee().getFullName());
            report.setDate(attendance.getDate());
            report.setDayStartTime(attendance.getDayStartTime());
            report.setDayEndTime(attendance.getDayEndTime());
            
            // Calculate work, idle, and travel time from job status logs
            List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployee(
                    attendance.getEmployee(), 
                    org.springframework.data.domain.Pageable.unpaged()
            ).getContent();
            
            int totalWorkMinutes = 0;
            int totalIdleMinutes = 0;
            int totalTravelMinutes = 0;
            
            for (MiniJobCard jobCard : jobCards) {
                if (jobCard.getStartTime() != null && 
                    jobCard.getStartTime().toLocalDate().equals(attendance.getDate())) {
                    
                    List<JobStatusLog> logs = jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());
                    
                    // Calculate time in each status
                    for (int i = logs.size() - 1; i > 0; i--) {
                        JobStatusLog currentLog = logs.get(i);
                        JobStatusLog nextLog = logs.get(i - 1);
                        
                        long minutes = java.time.Duration.between(currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();
                        
                        if (currentLog.getNewStatus() == JobStatus.STARTED) {
                            totalWorkMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                            totalIdleMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                            totalTravelMinutes += minutes;
                        }
                    }
                }
            }
            
            report.setWorkMinutes(totalWorkMinutes);
            report.setIdleMinutes(totalIdleMinutes);
            report.setTravelMinutes(totalTravelMinutes);
            report.setTotalMinutes(attendance.getTotalWorkMinutes());
            
            reports.add(report);
        }
        
        return reports;
    }
    
    public List<OTReportResponse> getOTReport(Long employeeId, LocalDate startDate, LocalDate endDate) {
        User employee = null;
        if (employeeId != null) {
            employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
        }
        
        List<EmployeeDayAttendance> attendances;
        if (employee != null) {
            attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
        } else {
            attendances = new ArrayList<>();
            List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
            for (User emp : employees) {
                attendances.addAll(attendanceRepository.findByEmployeeAndDateBetween(emp, startDate, endDate));
            }
        }
        
        List<OTReportResponse> reports = new ArrayList<>();
        
        for (EmployeeDayAttendance attendance : attendances) {
            OTReportResponse report = new OTReportResponse();
            report.setEmployeeName(attendance.getEmployee().getFullName());
            report.setDate(attendance.getDate());
            report.setMorningOtMinutes(attendance.getMorningOtMinutes());
            report.setEveningOtMinutes(attendance.getEveningOtMinutes());
            report.setTotalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());
            
            reports.add(report);
        }
        
        return reports;
    }
    
    public Map<String, Object> getOTReportByGenerator(LocalDate startDate, LocalDate endDate) {
        List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
        
        Map<String, Map<String, Integer>> generatorOTMap = new HashMap<>();
        
        for (User employee : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
            
            for (EmployeeDayAttendance attendance : attendances) {
                // Get job cards for this employee on this date
                List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployee(
                        employee, 
                        org.springframework.data.domain.Pageable.unpaged()
                ).getContent().stream()
                        .filter(jc -> jc.getStartTime() != null && 
                                     jc.getStartTime().toLocalDate().equals(attendance.getDate()))
                        .collect(Collectors.toList());
                
                for (MiniJobCard jobCard : jobCards) {
                    String generatorName = jobCard.getMainTicket().getGenerator().getName();
                    
                    generatorOTMap.putIfAbsent(generatorName, new HashMap<>());
                    Map<String, Integer> otData = generatorOTMap.get(generatorName);
                    
                    otData.put("morningOT", otData.getOrDefault("morningOT", 0) + attendance.getMorningOtMinutes());
                    otData.put("eveningOT", otData.getOrDefault("eveningOT", 0) + attendance.getEveningOtMinutes());
                    otData.put("totalOT", otData.getOrDefault("totalOT", 0) + 
                              attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());
                }
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("generatorWiseOT", generatorOTMap);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        
        return result;
    }
    
    public Map<String, Object> getEmployeeScoreReport(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        List<EmployeeScore> scores = employeeScoreRepository.findByEmployeeId(employeeId);
        
        int totalWeightedScore = 0;
        int totalWeight = 0;
        
        for (EmployeeScore score : scores) {
            totalWeightedScore += score.getScore() * score.getWeight();
            totalWeight += score.getWeight();
        }
        
        double averageScore = totalWeight > 0 ? (double) totalWeightedScore / totalWeight : 0.0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("employeeName", employee.getFullName());
        result.put("totalScores", scores.size());
        result.put("averageScore", averageScore);
        result.put("scores", scores);
        
        return result;
    }
}
