package com.ems.repository;

import com.ems.dto.EmployeeOtMinutesDTO;
import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.User;
import com.ems.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeDayAttendanceRepository extends JpaRepository<EmployeeDayAttendance, Long> {
    Optional<EmployeeDayAttendance> findByEmployeeAndDate(User employee, LocalDate date);
    List<EmployeeDayAttendance> findByEmployeeAndDateBetween(User employee, LocalDate startDate, LocalDate endDate);
    Optional<EmployeeDayAttendance> findByUniqueKey(String uniqueKey);

    // ------------------------------------------------------------------
    // Aggregates - replace "one attendance query per employee inside a loop".
    // ------------------------------------------------------------------

    /**
     * Total worked minutes across every user holding the given role, over an inclusive
     * date range. SQL SUM skips nulls, which reproduces the null-as-zero treatment the
     * previous per-employee loop applied. Returns null when nothing matches.
     */
    @Query("SELECT SUM(a.totalWorkMinutes) FROM EmployeeDayAttendance a " +
            "WHERE a.employee.role = :role AND a.date BETWEEN :startDate AND :endDate")
    Long sumTotalWorkMinutesByRoleAndDateBetween(
            @Param("role") UserRole role,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Total overtime minutes (morning plus evening) across every user holding the given
     * role, over an inclusive date range. Each component is coalesced to zero
     * individually so a row with only one of the two set still contributes, exactly as
     * the previous in-memory accumulation did. Returns null when nothing matches.
     */
    @Query("SELECT SUM(COALESCE(a.morningOtMinutes, 0) + COALESCE(a.eveningOtMinutes, 0)) " +
            "FROM EmployeeDayAttendance a " +
            "WHERE a.employee.role = :role AND a.date BETWEEN :startDate AND :endDate")
    Long sumOtMinutesByRoleAndDateBetween(
            @Param("role") UserRole role,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Overtime minutes per employee over an inclusive date range, optionally narrowed
     * to a single employee. Employees with no attendance in the range produce no row;
     * callers default them to zero.
     *
     * <p>{@code :employeeId} is cast in its IS NULL test because PostgreSQL cannot
     * infer a type for a placeholder that stands alone as {@code $n IS NULL} and
     * rejects the statement with SQLSTATE 42P18. Without the cast this fails for
     * every caller that passes null, which is the "all employees" performance report.
     */
    @Query("""
            SELECT new com.ems.dto.EmployeeOtMinutesDTO(
                       a.employee.id,
                       COALESCE(SUM(COALESCE(a.morningOtMinutes, 0) + COALESCE(a.eveningOtMinutes, 0)), 0))
            FROM EmployeeDayAttendance a
            WHERE a.date BETWEEN :startDate AND :endDate
              AND (CAST(:employeeId AS long) IS NULL OR a.employee.id = :employeeId)
            GROUP BY a.employee.id
            """)
    List<EmployeeOtMinutesDTO> sumOtMinutesByEmployee(
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate,
            @Param("employeeId") Long employeeId);
}
