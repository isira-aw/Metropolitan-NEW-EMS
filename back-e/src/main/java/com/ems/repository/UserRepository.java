package com.ems.repository;

import com.ems.dto.EmployeeOptionDTO;
import com.ems.entity.User;
import com.ems.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findByRoleAndActive(UserRole role, Boolean active, Pageable pageable);
    Page<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);
    boolean existsByRole(UserRole role);

    /**
     * Minimal employee rows for dropdowns/filters - id, name and active flag only.
     * Projected in the query so the base64-free but still comparatively wide User
     * rows are never loaded just to render a picker.
     */
    @Query("""
            SELECT new com.ems.dto.EmployeeOptionDTO(u.id, u.fullName, u.email, u.active, u.hasProfilePicture)
            FROM User u
            WHERE u.role = :role
              AND (:activeOnly = false OR u.active = true)
            ORDER BY u.fullName ASC
            """)
    List<EmployeeOptionDTO> findEmployeeOptions(@Param("role") UserRole role,
                                                @Param("activeOnly") boolean activeOnly);
}
