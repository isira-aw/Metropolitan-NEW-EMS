package com.ems.repository;

import com.ems.dto.EmployeeJobCardStatsDTO;
import com.ems.dto.PendingApprovalDayCountDTO;
import com.ems.entity.JobStatus;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface MiniJobCardRepository extends JpaRepository<MiniJobCard, Long> {
    Page<MiniJobCard> findByEmployee(User employee, Pageable pageable);
    Page<MiniJobCard> findByEmployeeAndStatus(User employee, JobStatus status, Pageable pageable);
    // Caller passes Pageable with Sort.by("endTime").descending() already applied
    Page<MiniJobCard> findByStatusAndApproved(JobStatus status, Boolean approved, Pageable pageable);
    List<MiniJobCard> findByMainTicketId(Long mainTicketId);
    Page<MiniJobCard> findByMainTicketId(Long mainTicketId, Pageable pageable);

    long countByEmployeeAndMainTicket_ScheduledDateAndStatus(
            User employee,
            LocalDate scheduledDate,
            JobStatus status
    );

    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee " +
            "ORDER BY m.mainTicket.scheduledDate ASC, m.mainTicket.scheduledTime ASC")
    Page<MiniJobCard> findByEmployeeOrderByScheduledDateTime(@Param("employee") User employee, Pageable pageable);

    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee AND m.status = :status " +
            "ORDER BY m.mainTicket.scheduledDate ASC, m.mainTicket.scheduledTime ASC")
    Page<MiniJobCard> findByEmployeeAndStatusOrderByScheduledDateTime(
            @Param("employee") User employee, @Param("status") JobStatus status, Pageable pageable);

    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee AND m.mainTicket.scheduledDate = :date " +
            "ORDER BY m.mainTicket.scheduledTime ASC")
    Page<MiniJobCard> findByEmployeeAndScheduledDateOrderByScheduledTime(
            @Param("employee") User employee, @Param("date") LocalDate date, Pageable pageable);

    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee AND m.mainTicket.scheduledDate = :date " +
            "AND m.status = :status ORDER BY m.mainTicket.scheduledTime ASC")
    Page<MiniJobCard> findByEmployeeAndScheduledDateAndStatusOrderByScheduledTime(
            @Param("employee") User employee, @Param("date") LocalDate date,
            @Param("status") JobStatus status, Pageable pageable);

    // --- Approvals calendar support ---

    /**
     * Pending approvals (COMPLETED + not approved) whose endTime falls within
     * a given range, filtered further by exact endTime date on the frontend/service.
     * Used to build the monthly calendar counts.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.status = :status AND m.approved = :approved " +
            "AND m.endTime >= :start AND m.endTime < :end")
    List<MiniJobCard> findByStatusAndApprovedAndEndTimeBetween(
            @Param("status") JobStatus status, @Param("approved") Boolean approved,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Pending approvals (COMPLETED + not approved) whose endTime falls on a single day.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.status = :status AND m.approved = :approved " +
            "AND m.endTime >= :start AND m.endTime < :end")
    Page<MiniJobCard> findByStatusAndApprovedAndEndTimeBetween(
            @Param("status") JobStatus status, @Param("approved") Boolean approved,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    /**
     * Pending approvals (COMPLETED + not approved) whose <em>startTime</em> falls on a
     * single day.
     *
     * <p>Separate from the endTime variant above because the approvals screen's plain
     * date filter has always matched on startTime, while its calendar view matches on
     * endTime. That filtering used to run in the browser after fetching up to 1000
     * rows; doing it here returns the same cards one page at a time.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.status = :status AND m.approved = :approved " +
            "AND m.startTime >= :start AND m.startTime < :end")
    Page<MiniJobCard> findByStatusAndApprovedAndStartTimeBetween(
            @Param("status") JobStatus status, @Param("approved") Boolean approved,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    // ------------------------------------------------------------------
    // Aggregates
    //
    // Everything below answers a question with counts and sums computed in the
    // database. None of it selects MiniJobCard entities, and therefore none of it
    // reads the imageUrl column.
    //
    // That distinction is the point: imageUrl holds a multi-megabyte base64 photo and
    // is a plain eagerly-fetched column, so every MiniJobCard entity Hibernate
    // materialises drags its photo into the heap even though @JsonIgnore keeps it out
    // of the response. Statistics endpoints that loaded whole tables this way were
    // exhausting the container's heap in production.
    // ------------------------------------------------------------------

    /**
     * Pending approvals (COMPLETED + not approved) grouped by the calendar day of
     * {@code endTime}, for job cards inside the given half-open range.
     *
     * <p>Grouping on YEAR/MONTH/DAY rather than casting to a date keeps the query
     * portable between PostgreSQL in production and H2 in the tests, and matches the
     * previous in-memory grouping on {@code endTime.toLocalDate()} exactly: the column
     * is a timestamp without time zone, so both read the same wall-clock day. Rows with
     * a null endTime cannot satisfy the range predicate, which reproduces the explicit
     * null filter the in-memory version applied.
     */
    @Query("""
            SELECT new com.ems.dto.PendingApprovalDayCountDTO(
                       YEAR(m.endTime), MONTH(m.endTime), DAY(m.endTime), COUNT(m.id))
            FROM MiniJobCard m
            WHERE m.status = :status AND m.approved = :approved
              AND m.endTime >= :start AND m.endTime < :end
            GROUP BY YEAR(m.endTime), MONTH(m.endTime), DAY(m.endTime)
            """)
    List<PendingApprovalDayCountDTO> countPendingApprovalsByDay(
            @Param("status") JobStatus status, @Param("approved") Boolean approved,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByStatus(JobStatus status);

    long countByStatusAndApproved(JobStatus status, Boolean approved);

    long countByEmployee(User employee);

    long countByEmployeeAndStatus(User employee, JobStatus status);

    long countByEmployeeAndStatusIn(User employee, Collection<JobStatus> statuses);

    /**
     * Sum of workMinutes for one employee over a half-open endTime range. Returns null
     * when no job card matches - SQL SUM over an empty set is null - so callers treat
     * null as zero.
     */
    @Query("SELECT SUM(m.workMinutes) FROM MiniJobCard m WHERE m.employee = :employee " +
            "AND m.endTime >= :start AND m.endTime < :end")
    Long sumWorkMinutesByEmployeeAndEndTimeRange(
            @Param("employee") User employee,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Per-employee job-card totals over a half-open createdAt range, optionally
     * narrowed to a single employee. One query in place of one query per employee.
     *
     * <p>{@code :employeeId} is cast in its IS NULL test because PostgreSQL cannot
     * infer a type for a placeholder that stands alone as {@code $n IS NULL} and
     * rejects the statement with SQLSTATE 42P18. Without the cast this fails for
     * every caller that passes null, which is the "all employees" performance report.
     */
    @Query("""
            SELECT new com.ems.dto.EmployeeJobCardStatsDTO(
                       m.employee.id,
                       COUNT(m.id),
                       SUM(CASE WHEN m.status = com.ems.entity.JobStatus.COMPLETED THEN 1 ELSE 0 END),
                       COALESCE(SUM(m.workMinutes), 0))
            FROM MiniJobCard m
            WHERE m.createdAt >= :start AND m.createdAt < :end
              AND (CAST(:employeeId AS long) IS NULL OR m.employee.id = :employeeId)
            GROUP BY m.employee.id
            """)
    List<EmployeeJobCardStatsDTO> aggregateByEmployeeForCreatedAtRange(
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
            @Param("employeeId") Long employeeId);

    /**
     * How many *other* job cards this employee has in one of the given statuses on a
     * scheduled date. Backs the single-active-ticket rule, which previously loaded the
     * employee's entire job-card history - photos included - to answer the same
     * question on a hot mobile path.
     */
    @Query("SELECT COUNT(m.id) FROM MiniJobCard m WHERE m.employee = :employee " +
            "AND m.id <> :excludeId AND m.mainTicket.scheduledDate = :date " +
            "AND m.status IN :statuses")
    long countOtherCardsForEmployeeOnDateWithStatusIn(
            @Param("employee") User employee, @Param("excludeId") Long excludeId,
            @Param("date") LocalDate date, @Param("statuses") Collection<JobStatus> statuses);

    /**
     * Job cards for one employee on a scheduled date whose status is not one of the
     * given "finished" statuses. Backs the day-closure restriction, which needs the
     * matching tickets themselves to name them in the error message.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee " +
            "AND m.mainTicket.scheduledDate = :date AND m.status NOT IN :statuses")
    List<MiniJobCard> findByEmployeeAndScheduledDateAndStatusNotIn(
            @Param("employee") User employee, @Param("date") LocalDate date,
            @Param("statuses") Collection<JobStatus> statuses);

    /**
     * One employee's job cards inside a half-open endTime range. Same rows the work
     * report used to obtain by loading the employee's whole history and filtering in
     * the browser-facing service layer.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee " +
            "AND m.endTime >= :start AND m.endTime < :end")
    List<MiniJobCard> findByEmployeeAndEndTimeRange(
            @Param("employee") User employee,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Ids of approved, completed job cards that have an endTime but no EmployeeScore
     * yet - the exact set the score backfill acts on.
     *
     * <p>The backfill used to load the whole table as entities and skip almost all of
     * them. Selecting ids lets it fetch only the cards it will actually write a score
     * for, so an admin running it cannot take the container down with it.
     */
    @Query("""
            SELECT m.id FROM MiniJobCard m
            WHERE m.approved = true
              AND m.status = com.ems.entity.JobStatus.COMPLETED
              AND m.endTime IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM EmployeeScore s WHERE s.miniJobCard.id = m.id)
            ORDER BY m.id
            """)
    List<Long> findIdsNeedingScoreBackfill();

    /**
     * One employee's job cards inside a half-open startTime range.
     */
    @Query("SELECT m FROM MiniJobCard m WHERE m.employee = :employee " +
            "AND m.startTime >= :start AND m.startTime < :end")
    List<MiniJobCard> findByEmployeeAndStartTimeRange(
            @Param("employee") User employee,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
