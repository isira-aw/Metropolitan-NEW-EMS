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

    @Autowired
    private EmployeeScoreRepository employeeScoreRepository;

    @Autowired
    private MainTicketRepository mainTicketRepository;

    @Autowired
    private GeneratorRepository generatorRepository;
    
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

    public Map<String, Object> getTicketCompletionReport(LocalDate startDate, LocalDate endDate) {
        List<MainTicket> allTickets = mainTicketRepository.findByScheduledDateBetween(
                startDate, endDate, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        long completed = allTickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();
        long pending = allTickets.stream().filter(t -> t.getStatus() == JobStatus.PENDING).count();
        long active = allTickets.stream().filter(t -> t.getStatus() == JobStatus.STARTED ||
                t.getStatus() == JobStatus.TRAVELING).count();
        long cancelled = allTickets.stream().filter(t -> t.getStatus() == JobStatus.CANCEL).count();

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("totalTickets", allTickets.size());
        result.put("completedTickets", completed);
        result.put("pendingTickets", pending);
        result.put("activeTickets", active);
        result.put("cancelledTickets", cancelled);
        result.put("completionRate", allTickets.size() > 0 ? (completed * 100.0 / allTickets.size()) : 0);

        return result;
    }

    public List<Map<String, Object>> getEmployeeProductivityReport(
            LocalDate startDate, LocalDate endDate, Long employeeId) {

        List<User> employees;
        if (employeeId != null) {
            User emp = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            employees = List.of(emp);
        } else {
            employees = userRepository.findByRole(UserRole.EMPLOYEE,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        List<Map<String, Object>> report = new ArrayList<>();

        for (User employee : employees) {
            List<MiniJobCard> cards = miniJobCardRepository.findByEmployee(
                            employee, org.springframework.data.domain.Pageable.unpaged())
                    .getContent()
                    .stream()
                    .filter(c -> c.getCreatedAt().toLocalDate().isAfter(startDate.minusDays(1)) &&
                            c.getCreatedAt().toLocalDate().isBefore(endDate.plusDays(1)))
                    .toList();

            long completedJobs = cards.stream().filter(c -> c.getStatus() == JobStatus.COMPLETED).count();
            int totalWorkMinutes = cards.stream().mapToInt(MiniJobCard::getWorkMinutes).sum();

            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(
                    employee, startDate, endDate);
            int totalOT = attendances.stream()
                    .mapToInt(a -> a.getMorningOtMinutes() + a.getEveningOtMinutes())
                    .sum();

            Map<String, Object> empReport = new HashMap<>();
            empReport.put("employeeId", employee.getId());
            empReport.put("employeeName", employee.getFullName());
            empReport.put("totalJobs", cards.size());
            empReport.put("completedJobs", completedJobs);
            empReport.put("totalWorkHours", totalWorkMinutes / 60.0);
            empReport.put("totalOTHours", totalOT / 60.0);
            empReport.put("completionRate", cards.size() > 0 ? (completedJobs * 100.0 / cards.size()) : 0);

            report.add(empReport);
        }

        return report;
    }

    public Map<String, Object> getGeneratorServiceHistory(Long generatorId) {
        Generator generator = generatorRepository.findById(generatorId)
                .orElseThrow(() -> new RuntimeException("Generator not found"));

        List<MainTicket> tickets = mainTicketRepository.findAll().stream()
                .filter(t -> t.getGenerator().getId().equals(generatorId))
                .toList();

        long completed = tickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();

        Map<String, Object> result = new HashMap<>();
        result.put("generatorId", generatorId);
        result.put("generatorName", generator.getName());
        result.put("generatorLocation", generator.getLocationName());
        result.put("totalServices", tickets.size());
        result.put("completedServices", completed);
        result.put("tickets", tickets);

        return result;
    }

    public Map<String, Object> getDailyAttendanceReport(LocalDate date) {
        List<User> allEmployees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<Map<String, Object>> attendanceData = new ArrayList<>();
        int totalWorkMinutes = 0;
        int totalOT = 0;

        for (User employee : allEmployees) {
            EmployeeDayAttendance attendance = attendanceRepository.findByEmployeeAndDate(employee, date)
                    .orElse(null);

            if (attendance != null) {
                Map<String, Object> data = new HashMap<>();
                data.put("employeeName", employee.getFullName());
                data.put("dayStartTime", attendance.getDayStartTime());
                data.put("dayEndTime", attendance.getDayEndTime());
                data.put("totalWorkMinutes", attendance.getTotalWorkMinutes());
                data.put("morningOT", attendance.getMorningOtMinutes());
                data.put("eveningOT", attendance.getEveningOtMinutes());
                data.put("totalOT", attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());

                attendanceData.add(data);
                totalWorkMinutes += attendance.getTotalWorkMinutes();
                totalOT += attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes();
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("date", date);
        result.put("employeesWorked", attendanceData.size());
        result.put("totalEmployees", allEmployees.size());
        result.put("totalWorkHours", totalWorkMinutes / 60.0);
        result.put("totalOTHours", totalOT / 60.0);
        result.put("attendanceData", attendanceData);

        return result;
    }

    public Map<String, Object> getMonthlySummaryReport(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<MainTicket> tickets = mainTicketRepository.findByScheduledDateBetween(
                startDate, endDate, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        int totalWorkMinutes = 0;
        int totalOT = 0;

        for (User emp : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(
                    emp, startDate, endDate);
            totalWorkMinutes += attendances.stream().mapToInt(EmployeeDayAttendance::getTotalWorkMinutes).sum();
            totalOT += attendances.stream()
                    .mapToInt(a -> a.getMorningOtMinutes() + a.getEveningOtMinutes())
                    .sum();
        }

        long completedTickets = tickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();

        Map<String, Object> result = new HashMap<>();
        result.put("year", year);
        result.put("month", month);
        result.put("totalTickets", tickets.size());
        result.put("completedTickets", completedTickets);
        result.put("totalEmployees", employees.size());
        result.put("totalWorkHours", totalWorkMinutes / 60.0);
        result.put("totalOTHours", totalOT / 60.0);
        result.put("completionRate", tickets.size() > 0 ? (completedTickets * 100.0 / tickets.size()) : 0);

        return result;
    }

    public byte[] exportTimeTrackingReportCSV(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<TimeTrackingReportResponse> data = getTimeTrackingReport(employeeId, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Employee Name,Date,Day Start,Day End,Work Minutes,Idle Minutes,Travel Minutes,Total Minutes\n");

        for (TimeTrackingReportResponse row : data) {
            csv.append(row.getEmployeeName()).append(",");
            csv.append(row.getDate()).append(",");
            csv.append(row.getDayStartTime()).append(",");
            csv.append(row.getDayEndTime()).append(",");
            csv.append(row.getWorkMinutes()).append(",");
            csv.append(row.getIdleMinutes()).append(",");
            csv.append(row.getTravelMinutes()).append(",");
            csv.append(row.getTotalMinutes()).append("\n");
        }

        return csv.toString().getBytes();
    }

    public byte[] exportOTReportCSV(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<OTReportResponse> data = getOTReport(employeeId, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Employee Name,Date,Morning OT (minutes),Evening OT (minutes),Total OT (minutes)\n");

        for (OTReportResponse row : data) {
            csv.append(row.getEmployeeName()).append(",");
            csv.append(row.getDate()).append(",");
            csv.append(row.getMorningOtMinutes()).append(",");
            csv.append(row.getEveningOtMinutes()).append(",");
            csv.append(row.getTotalOtMinutes()).append("\n");
        }

        return csv.toString().getBytes();
    }

    public Map<String, Object> getDashboardStatistics() {
        List<MainTicket> allTickets = mainTicketRepository.findAll();
        List<MiniJobCard> allJobCards = miniJobCardRepository.findAll();
        List<User> allEmployees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        long activeTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.STARTED || t.getStatus() == JobStatus.TRAVELING)
                .count();

        long activeJobs = allJobCards.stream()
                .filter(c -> c.getStatus() == JobStatus.STARTED || c.getStatus() == JobStatus.TRAVELING)
                .count();

        long pendingApprovals = allJobCards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED && !c.isApproved())
                .count();

        // Count employees currently working (day started but not ended today)
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Colombo"));
        long employeesWorking = allEmployees.stream()
                .filter(emp -> {
                    var attendance = attendanceRepository.findByEmployeeAndDate(emp, today);
                    return attendance.isPresent() && attendance.get().getDayEndTime() == null;
                })
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeTickets", activeTickets);
        stats.put("activeJobs", activeJobs);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("employeesWorking", employeesWorking);
        stats.put("totalEmployees", allEmployees.size());
        stats.put("timestamp", java.time.LocalDateTime.now());

        return stats;
    }
}
