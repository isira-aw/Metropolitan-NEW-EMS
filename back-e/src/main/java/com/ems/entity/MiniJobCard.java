package com.ems.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mini_job_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MiniJobCard {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "main_ticket_id", nullable = false)
    private MainTicket mainTicket;
    
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.PENDING;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private Boolean approved = false;

    private Integer workMinutes = 0;

    /**
     * Full base64 data URL of the job-card photo (e.g. "data:image/jpeg;base64,...").
     *
     * <p>Deliberately never serialized. This column routinely holds several megabytes,
     * and because mini job cards are returned from list endpoints (approvals, ticket
     * detail, the employee's own list) including it meant a single page of 10 rows
     * could weigh tens of megabytes - and the admin approvals screen requested up to
     * 1000 rows at a time. Clients read {@link #hasImage} to decide whether a photo
     * exists, then fetch the bytes on demand from the dedicated image endpoints
     * (GET /api/employee/job-cards/{id}/image, GET /api/admin/job-cards/{id}/image).
     *
     * <p>The stored data is untouched - this only changes what is sent over the wire.
     */
    @JsonIgnore
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String rejectionNote;


    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Cheap flag telling clients whether {@link #imageUrl} holds a photo, so list
     * views can render a "view photo" affordance without transferring the blob.
     * Derived, not persisted.
     */
    @Transient
    @JsonProperty("hasImage")
    public boolean hasImage() {
        return imageUrl != null && !imageUrl.isBlank();
    }
}
