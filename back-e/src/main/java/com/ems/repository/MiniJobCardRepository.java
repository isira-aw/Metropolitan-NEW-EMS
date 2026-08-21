package com.ems.repository;

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
}
