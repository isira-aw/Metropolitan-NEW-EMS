package com.ems.repository;

import com.ems.entity.JobStatus;
import com.ems.entity.MainTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface MainTicketRepository extends JpaRepository<MainTicket, Long> {
    Page<MainTicket> findByStatus(JobStatus status, Pageable pageable);
    Page<MainTicket> findByScheduledDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<MainTicket> findByCreatedBy(String createdBy, Pageable pageable);
    // Caller passes Pageable with Sort.by("createdAt").descending() already applied
    Page<MainTicket> findByGeneratorId(Long generatorId, Pageable pageable);
}
