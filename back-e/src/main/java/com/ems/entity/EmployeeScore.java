package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
    
    @ManyToOne
    @JoinColumn(name = "main_ticket_id", nullable = false)
    private MainTicket mainTicket;
    
    @Column(nullable = false)
    private Integer weight;
    
    @Column(nullable = false)
    private Integer score; // 1-5 or 1-10 based on admin choice
    
    @Column(nullable = false)
    private String approvedBy;
    
    @Column(nullable = false)
    private LocalDateTime approvedAt;
}
