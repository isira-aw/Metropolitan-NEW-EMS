package com.ems.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads/job-cards}")
    private String uploadDir;

    public String storeFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file");
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Validate image file
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            // Generate unique filename
            String filename = UUID.randomUUID().toString() + fileExtension;

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Store file
            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return filename;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file", ex);
        }
    }

    public void deleteFile(String filename) {
        try {
            if (filename != null && !filename.isEmpty()) {
                Path filePath = Paths.get(uploadDir).resolve(filename);
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ex) {
            throw new RuntimeException("Failed to delete file", ex);
        }
    }

    public Path loadFile(String filename) {
        return Paths.get(uploadDir).resolve(filename);
    }
}
