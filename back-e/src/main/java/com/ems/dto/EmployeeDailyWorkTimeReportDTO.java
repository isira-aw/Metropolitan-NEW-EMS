package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Employee Daily Work Time Report
 * Shows daily work hours, OT, and weight earned for a specific employee
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDailyWorkTimeReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer morningOtMinutes;
    private Double morningOtHours;
    private Integer eveningOtMinutes;
    private Double eveningOtHours;
    private Integer totalOtMinutes;
    private Double totalOtHours;
    private Integer workingMinutes;
    private Double workingHours;
    private Integer totalWeightEarned; // Weight earned only on this day
    private Integer jobsCompleted; // Number of jobs completed on this day

    // Helper method to convert minutes to hours
    public static Double minutesToHours(Integer minutes) {
        return minutes != null ? Math.round(minutes / 60.0 * 100.0) / 100.0 : 0.0;
    }
}
