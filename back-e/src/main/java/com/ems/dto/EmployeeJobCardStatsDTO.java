package com.ems.dto;

/**
 * Per-employee job-card totals, aggregated by the database.
 *
 * <p>Replaces the pattern of loading one employee's entire job-card history as
 * entities and reducing it with streams. Those entities carry the base64 photo in
 * {@code imageUrl}, so a report that looped over every employee pulled the whole
 * {@code mini_job_cards} table - photos included - into the heap to produce three
 * numbers per employee.
 *
 * <p>Employees with no job cards in the window produce no row at all (a GROUP BY only
 * emits groups that exist). Callers that must list every employee regardless are
 * expected to default the missing ones to zero, which is what the previous in-memory
 * version produced for them.
 *
 * @param employeeId      the employee's user id
 * @param totalJobs       job cards in the window
 * @param completedJobs   job cards in the window with status COMPLETED
 * @param totalWorkMinutes sum of workMinutes over the window, nulls counted as zero
 */
public record EmployeeJobCardStatsDTO(Long employeeId, Long totalJobs, Long completedJobs,
                                      Long totalWorkMinutes) {
}
