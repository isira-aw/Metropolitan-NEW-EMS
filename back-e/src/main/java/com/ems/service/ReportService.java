package com.ems.service;

import com.ems.config.TimeZoneConfig;
import com.ems.dto.DailyTimeTrackingReportDTO;
import com.ems.dto.EmployeeDailyWorkTimeReportDTO;
import com.ems.dto.EmployeeJobCardStatsDTO;
import com.ems.dto.EmployeeOtMinutesDTO;
import com.ems.dto.OTReportResponse;
import com.ems.dto.TimeTrackingReportResponse;
import com.ems.entity.*;
import com.ems.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.util.*;
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

    @Autowired
    private TimeZoneConfig timeZoneConfig;
    
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
            
            // Calculate work, idle, and travel time from job status logs.
            // Restricted to this attendance day by the database; this sits inside a
            // loop over every attendance row and used to load the employee's entire
            // job-card history - base64 photos included - on each pass.
            List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployeeAndStartTimeRange(
                    attendance.getEmployee(),
                    attendance.getDate().atStartOfDay(),
                    attendance.getDate().plusDays(1).atStartOfDay());

            int totalWorkMinutes = 0;
            int totalIdleMinutes = 0;
            int totalTravelMinutes = 0;

            for (MiniJobCard jobCard : jobCards) {
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
                // Get job cards for this employee on this date. Filtered by the
                // database; each pass of this nested loop used to load the employee's
                // whole job-card history, base64 photos included, and keep one day.
                List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployeeAndStartTimeRange(
                        employee,
                        attendance.getDate().atStartOfDay(),
                        attendance.getDate().plusDays(1).atStartOfDay());
                
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

        int totalScore = 0;

        for (EmployeeScore score : scores) {
            totalScore += score.getWeight(); // Weight is the score
        }

        double averageScore = scores.size() > 0 ? (double) totalScore / scores.size() : 0.0;
        
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

        // Two grouped queries replace two queries per employee, each of which used to
        // load that employee's entire job-card history - base64 photos included - only
        // to count and sum it here. With every employee selected that amounted to
        // pulling the whole mini_job_cards table, photos and all, into the heap.
        //
        // Employees with nothing in the window produce no group, so they are defaulted
        // to zero below and still get a row, exactly as before.
        Map<Long, EmployeeJobCardStatsDTO> cardStats = miniJobCardRepository
                .aggregateByEmployeeForCreatedAtRange(
                        startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay(), employeeId)
                .stream()
                .collect(Collectors.toMap(EmployeeJobCardStatsDTO::employeeId, s -> s));

        Map<Long, Long> otByEmployee = attendanceRepository
                .sumOtMinutesByEmployee(startDate, endDate, employeeId)
                .stream()
                .collect(Collectors.toMap(EmployeeOtMinutesDTO::employeeId, EmployeeOtMinutesDTO::otMinutes));

        List<Map<String, Object>> report = new ArrayList<>();

        for (User employee : employees) {
            EmployeeJobCardStatsDTO stats = cardStats.getOrDefault(
                    employee.getId(), new EmployeeJobCardStatsDTO(employee.getId(), 0L, 0L, 0L));

            int totalJobs = stats.totalJobs().intValue();
            long completedJobs = stats.completedJobs();
            int totalWorkMinutes = stats.totalWorkMinutes().intValue();
            int totalOT = otByEmployee.getOrDefault(employee.getId(), 0L).intValue();

            Map<String, Object> empReport = new HashMap<>();
            empReport.put("employeeId", employee.getId());
            empReport.put("employeeName", employee.getFullName());
            empReport.put("totalJobs", totalJobs);
            empReport.put("completedJobs", completedJobs);
            empReport.put("totalWorkMinutes", totalWorkMinutes);
            empReport.put("totalOTMinutes", totalOT);
            empReport.put("completionRate", totalJobs > 0 ? (completedJobs * 100.0 / totalJobs) : 0);

            report.add(empReport);
        }

        return report;
    }

    public Map<String, Object> getGeneratorServiceHistory(Long generatorId) {
        Generator generator = generatorRepository.findById(generatorId)
                .orElseThrow(() -> new RuntimeException("Generator not found"));

        // Filter by generator in the database instead of scanning every ticket in
        // the system in memory. Identical result set, far fewer rows loaded.
        List<MainTicket> tickets = mainTicketRepository
                .findByGeneratorId(generatorId, org.springframework.data.domain.Pageable.unpaged())
                .getContent();

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
        result.put("totalWorkMinutes", totalWorkMinutes);
        result.put("totalOTMinutes", totalOT);
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
        result.put("totalWorkMinutes", totalWorkMinutes);
        result.put("totalOTMinutes", totalOT);
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

    /**
     * Real-time admin dashboard counters, every one of them computed by the database.
     *
     * <p>This method used to begin with {@code mainTicketRepository.findAll()},
     * {@code miniJobCardRepository.findAll()} and {@code generatorRepository.findAll()},
     * then run one attendance query per employee. The mini job card load was the fatal
     * one: {@code MiniJobCard.imageUrl} holds a multi-megabyte base64 photo in an
     * eagerly fetched column, so loading the table loaded every photo in the system
     * into the heap. {@code @JsonIgnore} keeps those photos out of the response but
     * cannot stop Hibernate reading them. The container was killed on heap exhaustion
     * and everything returned 502 until it finished restarting.
     *
     * <p>The numbers and their meanings are unchanged - the same nine keys, computed
     * over the same rows.
     */
    public Map<String, Object> getDashboardStatistics() {
        // Employee counts. countByRoleAndActive matches active = true, which excludes
        // nulls exactly as the previous "getActive() != null && getActive()" did.
        long totalEmployees = userRepository.countByRole(UserRole.EMPLOYEE);
        long activeEmployees = userRepository.countByRoleAndActive(UserRole.EMPLOYEE, true);

        // Generator count
        long totalGenerators = generatorRepository.count();

        // Ticket counts
        long totalTickets = mainTicketRepository.count();
        long pendingTickets = mainTicketRepository.countByStatus(JobStatus.PENDING);
        long completedTickets = mainTicketRepository.countByStatus(JobStatus.COMPLETED);

        // Pending approvals
        long pendingApprovals = miniJobCardRepository.countByStatusAndApproved(JobStatus.COMPLETED, false);

        // Monthly work and OT minutes, summed in the database across every employee
        // rather than one query per employee. Restricted to role EMPLOYEE, which is
        // the set the previous loop iterated over.
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        Long workMinutes = attendanceRepository.sumTotalWorkMinutesByRoleAndDateBetween(
                UserRole.EMPLOYEE, firstDayOfMonth, lastDayOfMonth);
        Long otMinutes = attendanceRepository.sumOtMinutesByRoleAndDateBetween(
                UserRole.EMPLOYEE, firstDayOfMonth, lastDayOfMonth);

        long totalWorkMinutesThisMonth = workMinutes == null ? 0L : workMinutes;
        long totalOTMinutesThisMonth = otMinutes == null ? 0L : otMinutes;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("activeEmployees", activeEmployees);
        stats.put("totalGenerators", totalGenerators);
        stats.put("totalTickets", totalTickets);
        stats.put("pendingTickets", pendingTickets);
        stats.put("completedTickets", completedTickets);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("totalWorkMinutesThisMonth", totalWorkMinutesThisMonth);
        stats.put("totalOTMinutesThisMonth", totalOTMinutesThisMonth);

        return stats;
    }

    /**
     * Generate comprehensive employee work report for a date range
     *
     * Includes:
     * - Daily attendance (check-in/out, work hours, OT)
     * - Jobs worked on (generators/machines)
     * - Daily and total performance scores
     * - Summary statistics
     *
     * @param employeeId Employee ID
     * @param startDate Report start date
     * @param endDate Report end date
     * @return EmployeeWorkReportDTO with complete work details
     */
    public com.ems.dto.EmployeeWorkReportDTO getEmployeeWorkReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        // Fetch employee
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        // Fetch attendance records for date range
        List<EmployeeDayAttendance> attendances = attendanceRepository
                .findByEmployeeAndDateBetween(employee, startDate, endDate);

        // Fetch all mini job cards in date range. Filtered by the database on the same
        // endTime window as before, expressed as a half-open range; it used to load
        // the employee's whole history - base64 photos included - and discard most of
        // it here. A null endTime cannot satisfy the range, matching the old filter.
        List<MiniJobCard> allJobCards = miniJobCardRepository.findByEmployeeAndEndTimeRange(
                employee, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());

        // Fetch scores for the period
        List<EmployeeScore> scores = employeeScoreRepository
                .findByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate);

        // Build daily records
        List<com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord> dailyRecords = new ArrayList<>();
        int totalDaysWorked = 0;
        int totalWorkMinutes = 0;
        int totalOtMinutes = 0;
        int totalJobsCompleted = 0;
        int totalJobsScored = 0;
        int totalJobsPending = 0;
        int totalScore = 0; // Total score (sum of all weights since weight = score)
        List<Integer> dailyScores = new ArrayList<>();

        for (EmployeeDayAttendance attendance : attendances) {
            LocalDate date = attendance.getDate();

            // Filter jobs for this specific date
            List<MiniJobCard> dayJobs = allJobCards.stream()
                    .filter(jc -> jc.getEndTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());

            // Build job details
            List<com.ems.dto.EmployeeWorkReportDTO.JobDetail> jobDetails = new ArrayList<>();
            for (MiniJobCard jobCard : dayJobs) {
                // Get score for this job card if exists
                Optional<EmployeeScore> jobScore = scores.stream()
                        .filter(s -> s.getMiniJobCard().getId().equals(jobCard.getId()))
                        .findFirst();

                com.ems.dto.EmployeeWorkReportDTO.JobDetail jobDetail =
                        com.ems.dto.EmployeeWorkReportDTO.JobDetail.builder()
                        .miniJobCardId(jobCard.getId())
                        .mainTicketId(jobCard.getMainTicket().getId())
                        .ticketNumber(jobCard.getMainTicket().getTicketNumber())
                        .ticketTitle(jobCard.getMainTicket().getTitle())
                        .jobType(jobCard.getMainTicket().getType().toString())
                        .jobStatus(jobCard.getStatus().toString())
                        .generatorId(jobCard.getMainTicket().getGenerator().getId())
                        .generatorName(jobCard.getMainTicket().getGenerator().getName())
                        .generatorModel(jobCard.getMainTicket().getGenerator().getModel())
                        .generatorLocation(jobCard.getMainTicket().getGenerator().getLocationName())
                        .startTime(jobCard.getStartTime())
                        .endTime(jobCard.getEndTime())
                        .workMinutes(jobCard.getWorkMinutes())
                        .weight(jobCard.getMainTicket().getWeight())
                        .score(jobScore.map(EmployeeScore::getWeight).orElse(null)) // Weight is the score
                        .weightedScore(jobScore.map(EmployeeScore::getWeight).orElse(null)) // Same as score now
                        .scored(jobScore.isPresent())
                        .approved(jobCard.getApproved())
                        .build();

                jobDetails.add(jobDetail);

                // Update counters
                if (jobCard.getStatus() == JobStatus.COMPLETED) {
                    totalJobsCompleted++;
                    if (jobScore.isPresent()) {
                        totalJobsScored++;
                    } else if (jobCard.getApproved()) {
                        totalJobsPending++;
                    }
                }
            }

            // Calculate daily score (weight is the score)
            int dailyScore = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .mapToInt(EmployeeScore::getWeight) // Weight is the score
                    .sum();

            long dailyJobCount = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .count();

            double dailyAverageScore = dailyJobCount > 0
                    ? (double) dailyScore / dailyJobCount
                    : 0.0;

            if (dailyScore > 0) {
                dailyScores.add(dailyScore);
            }

            // Build daily record
            com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord dailyRecord =
                    com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord.builder()
                    .date(date)
                    .checkInTime(attendance.getDayStartTime())
                    .checkOutTime(attendance.getDayEndTime())
                    .totalWorkMinutes(attendance.getTotalWorkMinutes())
                    .morningOtMinutes(attendance.getMorningOtMinutes())
                    .eveningOtMinutes(attendance.getEveningOtMinutes())
                    .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                    .jobs(jobDetails)
                    .dailyScore(dailyScore > 0 ? dailyScore : null)
                    .dailyTotalWeight(dailyScore > 0 ? dailyScore : null) // Same as dailyScore now (weight = score)
                    .dailyAverageScore(dailyAverageScore > 0 ? dailyAverageScore : null)
                    .build();

            dailyRecords.add(dailyRecord);

            // Update summary counters
            totalDaysWorked++;
            totalWorkMinutes += attendance.getTotalWorkMinutes();
            totalOtMinutes += attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes();
            totalScore += dailyScore; // dailyScore is sum of weights for the day
        }

        // Calculate summary statistics
        double overallAverageScore = totalJobsScored > 0
                ? (double) totalScore / totalJobsScored
                : 0.0;

        Integer maxDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().max(Integer::compareTo).orElse(null);
        Integer minDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().min(Integer::compareTo).orElse(null);
        Double averageDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().mapToInt(Integer::intValue).average().orElse(0.0);

        com.ems.dto.EmployeeWorkReportDTO.SummaryStatistics summary =
                com.ems.dto.EmployeeWorkReportDTO.SummaryStatistics.builder()
                .totalDaysWorked(totalDaysWorked)
                .totalWorkMinutes(totalWorkMinutes)
                .totalOtMinutes(totalOtMinutes)
                .totalJobsCompleted(totalJobsCompleted)
                .totalJobsScored(totalJobsScored)
                .totalJobsPending(totalJobsPending)
                .totalWeightedScore(totalScore) // Total score (weight = score)
                .totalWeight(totalScore) // Same as totalWeightedScore now
                .overallAverageScore(overallAverageScore)
                .maxDailyScore(maxDailyScore)
                .minDailyScore(minDailyScore)
                .averageDailyScore(averageDailyScore)
                .build();

        // Build final report
        return com.ems.dto.EmployeeWorkReportDTO.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .employeeEmail(employee.getEmail())
                .reportStartDate(startDate)
                .reportEndDate(endDate)
                .dailyRecords(dailyRecords)
                .summary(summary)
                .build();
    }

    /**
     * Generate Daily Time Tracking Report with location information
     *
     * @param employeeId Optional employee ID (null for all employees)
     * @param startDate Report start date
     * @param endDate Report end date
     * @return List of DailyTimeTrackingReportDTO
     */
    public List<DailyTimeTrackingReportDTO> getDailyTimeTrackingReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        List<User> employees;
        if (employeeId != null) {
            User emp = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            employees = List.of(emp);
        } else {
            employees = userRepository.findByRole(UserRole.EMPLOYEE,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        List<DailyTimeTrackingReportDTO> reports = new ArrayList<>();

        for (User employee : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository
                    .findByEmployeeAndDateBetween(employee, startDate, endDate);

            for (EmployeeDayAttendance attendance : attendances) {
                LocalDate date = attendance.getDate();

                // Get all job cards for this employee on this date. Filtered by the
                // database: this sits inside a loop over every employee and every day
                // in the range, and each iteration used to load that employee's entire
                // job-card history - base64 photos included - to keep one day's worth.
                List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployeeAndStartTimeRange(
                        employee, date.atStartOfDay(), date.plusDays(1).atStartOfDay());

                // Calculate work, idle, and travel time from job status logs
                int totalWorkMinutes = 0;
                int totalIdleMinutes = 0;
                int totalTravelMinutes = 0;
                String location = "";
                List<DailyTimeTrackingReportDTO.LocationPoint> locationPath = new ArrayList<>();

                for (MiniJobCard jobCard : jobCards) {
                    List<JobStatusLog> logs = jobStatusLogRepository
                            .findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());

                    // Get location from the latest log with location data
                    if (location.isEmpty() && !logs.isEmpty()) {
                        for (JobStatusLog log : logs) {
                            if (log.getLatitude() != null && log.getLongitude() != null) {
                                // Use generator location as primary location
                                location = jobCard.getMainTicket().getGenerator().getLocationName();
                                break;
                            }
                        }
                    }

                    // Collect all location points from logs (in chronological order)
                    List<JobStatusLog> reversedLogs = new ArrayList<>(logs);
                    Collections.reverse(reversedLogs);
                    for (JobStatusLog log : reversedLogs) {
                        if (log.getLatitude() != null && log.getLongitude() != null) {
                            locationPath.add(DailyTimeTrackingReportDTO.LocationPoint.builder()
                                    .latitude(log.getLatitude())
                                    .longitude(log.getLongitude())
                                    .timestamp(log.getLoggedAt())
                                    .build());
                        }
                    }

                    // Calculate time in each status
                    for (int i = logs.size() - 1; i > 0; i--) {
                        JobStatusLog currentLog = logs.get(i);
                        JobStatusLog nextLog = logs.get(i - 1);

                        long minutes = java.time.Duration.between(
                                currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();

                        if (currentLog.getNewStatus() == JobStatus.STARTED) {
                            totalWorkMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                            totalIdleMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                            totalTravelMinutes += minutes;
                        }
                    }
                }

                DailyTimeTrackingReportDTO report = DailyTimeTrackingReportDTO.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getFullName())
                        .date(date)
                        .startTime(attendance.getDayStartTime())
                        .endTime(attendance.getDayEndTime())
                        .location(location.isEmpty() ? "N/A" : location)
                        .dailyWorkingMinutes(totalWorkMinutes)
                        .idleMinutes(totalIdleMinutes)
                        .travelMinutes(totalTravelMinutes)
                        .totalMinutes(attendance.getTotalWorkMinutes())
                        .locationPath(locationPath)
                        .build();

                reports.add(report);
            }
        }

        return reports;
    }

    /**
     * Generate Employee Daily Work Time Report with weight earned
     *
     * @param employeeId Employee ID (required)
     * @param startDate Report start date
     * @param endDate Report end date
     * @return List of EmployeeDailyWorkTimeReportDTO
     */
    public List<EmployeeDailyWorkTimeReportDTO> getEmployeeDailyWorkTimeReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<EmployeeDayAttendance> attendances = attendanceRepository
                .findByEmployeeAndDateBetween(employee, startDate, endDate);

        // Fetch scores for the period
        List<EmployeeScore> scores = employeeScoreRepository
                .findByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate);

        List<EmployeeDailyWorkTimeReportDTO> reports = new ArrayList<>();

        for (EmployeeDayAttendance attendance : attendances) {
            LocalDate date = attendance.getDate();

            // Calculate total weight earned on this day
            int totalWeightEarned = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .mapToInt(EmployeeScore::getWeight)
                    .sum();

            // Count jobs completed on this day
            long jobsCompleted = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .count();

            EmployeeDailyWorkTimeReportDTO report = EmployeeDailyWorkTimeReportDTO.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getFullName())
                    .date(date)
                    .startTime(attendance.getDayStartTime())
                    .endTime(attendance.getDayEndTime())
                    .morningOtMinutes(attendance.getMorningOtMinutes())
                    .eveningOtMinutes(attendance.getEveningOtMinutes())
                    .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                    .workingMinutes(attendance.getTotalWorkMinutes())
                    .totalWeightEarned(totalWeightEarned)
                    .jobsCompleted((int) jobsCompleted)
                    .build();

            reports.add(report);
        }

        return reports;
    }
}
