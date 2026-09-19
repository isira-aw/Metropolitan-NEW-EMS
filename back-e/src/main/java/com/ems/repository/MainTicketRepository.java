package com.ems.repository;

import com.ems.entity.JobStatus;
import com.ems.entity.MainTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface MainTicketRepository extends JpaRepository<MainTicket, Long> {
    Page<MainTicket> findByStatus(JobStatus status, Pageable pageable);
    Page<MainTicket> findByScheduledDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<MainTicket> findByCreatedBy(String createdBy, Pageable pageable);
    // Caller passes Pageable with Sort.by("createdAt").descending() already applied
    Page<MainTicket> findByGeneratorId(Long generatorId, Pageable pageable);

    // Cheap existence/size check used before deleting a generator, so a foreign key
    // violation is reported as a clear 400 instead of surfacing as a generic 500.
    long countByGeneratorId(Long generatorId);

    /**
     * Combined ticket search for the admin tickets screen. Every filter is optional -
     * pass null to skip it.
     *
     * <p>These filters previously ran in the browser, applied to whichever ten rows the
     * current page happened to contain, with totalPages recomputed from that slice.
     * Matching tickets on other pages were therefore invisible and the pager reported
     * wrong counts. Filtering here means a page of results is a page of *matches*.
     *
     * @param scheduledDate  exact scheduled date, or null for any
     * @param status         ticket status, or null for any
     * @param generatorName  case-insensitive substring of the generator's name, or null
     * @param employeeId     only tickets this employee is assigned to, or null for any
     */
    @Query("""
            SELECT DISTINCT t FROM MainTicket t
            WHERE (:scheduledDate IS NULL OR t.scheduledDate = :scheduledDate)
              AND (:status IS NULL OR t.status = :status)
              AND (:generatorName IS NULL
                   OR LOWER(t.generator.name) LIKE LOWER(CONCAT('%', CAST(:generatorName AS string), '%')))
              AND (:employeeId IS NULL
                   OR EXISTS (SELECT 1 FROM TicketAssignment ta
                              WHERE ta.mainTicket = t AND ta.employee.id = :employeeId))
            """)
    Page<MainTicket> search(
            @Param("scheduledDate") LocalDate scheduledDate,
            @Param("status") JobStatus status,
            @Param("generatorName") String generatorName,
            @Param("employeeId") Long employeeId,
            Pageable pageable);
}
