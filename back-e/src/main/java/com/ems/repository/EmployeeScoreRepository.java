package com.ems.repository;

import com.ems.entity.EmployeeScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeScoreRepository extends JpaRepository<EmployeeScore, Long> {
    List<EmployeeScore> findByEmployeeId(Long employeeId);
    List<EmployeeScore> findByMainTicketId(Long mainTicketId);
}
