package com.ems.dto;

import com.ems.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserPutRequest {
    @NotBlank(message = "Username is required")
    private String username;

    // Optional on update - only provided when the admin wants to change the
    // password. Blank/omitted means "keep the existing password". Length is
    // validated in UserService.updateUser rather than here, since @Size would
    // also reject a deliberately-blank "don't change it" value.
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Role is required")
    private UserRole role;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private Boolean active = true;
}
