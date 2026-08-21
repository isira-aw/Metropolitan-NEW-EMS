package com.ems.service;

import com.ems.entity.ProfilePicture;
import com.ems.entity.User;
import com.ems.repository.ProfilePictureRepository;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Optional;

@Service
public class ProfilePictureService {

    // Decoded image size cap (~2.5MB). Rejects absurdly large uploads with a
    // clean 400 (via GlobalExceptionHandler's RuntimeException handler)
    // instead of letting a huge TEXT blob hit the database.
    private static final int MAX_DECODED_BYTES = 2 * 1024 * 1024 + (1024 * 1024 / 2);

    @Autowired
    private ProfilePictureRepository profilePictureRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Fetch the raw base64 image for a user, or empty if none is set.
     * Any authenticated user may call this for any user id (see
     * ProfilePictureController) - it deliberately does not check hasProfilePicture
     * first so it stays correct even if that flag ever drifts.
     */
    public Optional<String> getImageBase64(Long userId) {
        // Ensure the user actually exists so callers get a clean 404 rather
        // than a false "no picture" for a bad id.
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        return profilePictureRepository.findByUserId(userId).map(ProfilePicture::getImageBase64);
    }

    /**
     * Own-photo lookup for the logged-in user (used by the sidebar avatar,
     * which only has the JWT username - no id - client-side).
     */
    public Optional<String> getOwnImageBase64(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return profilePictureRepository.findByUserId(user.getId()).map(ProfilePicture::getImageBase64);
    }

    @Transactional
    public void setPicture(Long userId, String rawImageBase64) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Convention: the frontend sends a full data URL (from FileReader's
        // readAsDataURL, e.g. "data:image/png;base64,...") and we store it
        // verbatim so the frontend can drop the response straight into an
        // <img src> without having to reconstruct a mime type. We only strip
        // the prefix transiently here to validate the decoded byte size.
        validateSize(stripDataUrlPrefix(rawImageBase64));

        ProfilePicture picture = profilePictureRepository.findByUserId(userId)
                .orElseGet(() -> {
                    ProfilePicture p = new ProfilePicture();
                    p.setUser(user);
                    return p;
                });
        picture.setImageBase64(rawImageBase64);
        profilePictureRepository.save(picture);

        if (!Boolean.TRUE.equals(user.getHasProfilePicture())) {
            user.setHasProfilePicture(true);
            userRepository.save(user);
        }
    }

    @Transactional
    public void deletePicture(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        profilePictureRepository.deleteByUserId(userId);

        if (!Boolean.FALSE.equals(user.getHasProfilePicture())) {
            user.setHasProfilePicture(false);
            userRepository.save(user);
        }
    }

    private String stripDataUrlPrefix(String value) {
        if (value == null) {
            return null;
        }
        int commaIndex = value.indexOf(',');
        if (value.startsWith("data:") && commaIndex != -1) {
            return value.substring(commaIndex + 1);
        }
        return value;
    }

    private void validateSize(String base64) {
        if (base64 == null || base64.isBlank()) {
            throw new RuntimeException("imageBase64 is required");
        }
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid base64 image data");
        }
        if (decoded.length == 0) {
            throw new RuntimeException("Invalid base64 image data");
        }
        if (decoded.length > MAX_DECODED_BYTES) {
            throw new RuntimeException("Image is too large - maximum size is 2.5MB");
        }
    }
}
