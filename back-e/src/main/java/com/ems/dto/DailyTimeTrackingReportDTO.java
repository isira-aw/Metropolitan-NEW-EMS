package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Daily Time Tracking Report
 * Shows employee time tracking details including location
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTimeTrackingReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private Integer dailyWorkingMinutes;
    private Double dailyWorkingHours;
    private Integer idleMinutes;
    private Double idleHours;
    private Integer travelMinutes;
    private Double travelHours;
    private Integer totalMinutes;
    private Double totalHours;

    // Helper method to convert minutes to hours
    public static Double minutesToHours(Integer minutes) {
        return minutes != null ? Math.round(minutes / 60.0 * 100.0) / 100.0 : 0.0;
    }
}
