package com.ems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScoreRequest {
    @NotNull(message = "Ticket ID is required")
    private Long ticketId;

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer score;
}
