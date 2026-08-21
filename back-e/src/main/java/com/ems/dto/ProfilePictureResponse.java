package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body for fetching a user's profile picture.
 * imageBase64 is null when the user has no picture set.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfilePictureResponse {
    private String imageBase64;
}
