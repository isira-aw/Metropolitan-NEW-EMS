package com.ems.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;

/**
 * AWS SES client configuration. Credentials are resolved via the default AWS
 * SDK credential chain (environment variables, shared config/credentials
 * file, or an IAM role on the host) - never read from application properties
 * or logged.
 */
@Configuration
public class AwsSesConfig {

    @Value("${aws.ses.region}")
    private String region;

    @Bean
    public SesClient sesClient() {
        return SesClient.builder()
                .region(Region.of(region))
                .build();
    }
}
