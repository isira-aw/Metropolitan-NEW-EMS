package com.ems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Score Request DTO
 * Used by admin to assign performance score to an approved mini job card
 *
 * Business Rule: MiniJobCard must be COMPLETED and APPROVED before scoring
 */
@Data
public class ScoreRequest {
    @NotNull(message = "Mini Job Card ID is required")
    private Long miniJobCardId;

    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer score;
}
