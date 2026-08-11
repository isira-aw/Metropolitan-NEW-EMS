package com.ems.dto;

import com.ems.entity.MiniJobCard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result of a bulk-approve operation. Unlike the old implementation, failed
 * IDs are reported back to the caller instead of being silently skipped.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApprovalResult {
    private List<MiniJobCard> approved;
    private List<FailedApproval> failed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailedApproval {
        private Long id;
        private String reason;
    }
}
