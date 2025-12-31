package com.ems.dto;

import com.ems.entity.JobStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "New status is required")
    private JobStatus newStatus;
    
    private Double latitude;
    private Double longitude;
}
