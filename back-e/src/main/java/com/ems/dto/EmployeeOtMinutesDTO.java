package com.ems.dto;

/**
 * Per-employee overtime total for a date range, aggregated by the database.
 *
 * <p>Replaces one attendance query per employee inside a loop (a classic N+1) with a
 * single grouped query. Morning and evening OT are summed with the same null-as-zero
 * treatment the previous in-memory version applied.
 *
 * @param employeeId the employee's user id
 * @param otMinutes  morning plus evening OT minutes over the range
 */
public record EmployeeOtMinutesDTO(Long employeeId, Long otMinutes) {
}
