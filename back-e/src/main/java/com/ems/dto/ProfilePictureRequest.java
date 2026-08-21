package com.ems.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for uploading/replacing a user's profile picture.
 * imageBase64 may optionally include a "data:image/...;base64," prefix -
 * the server strips it if present, so the frontend does not need to.
 */
@Data
public class ProfilePictureRequest {

    @NotBlank(message = "imageBase64 is required")
    private String imageBase64;
}
