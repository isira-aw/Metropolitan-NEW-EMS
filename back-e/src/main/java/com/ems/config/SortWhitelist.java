package com.ems.config;

import org.springframework.data.domain.Sort;

import java.util.Set;

/**
 * Builds a {@link Sort} from client-supplied {@code sortBy}/{@code sortDir} request
 * parameters, restricted to an explicit set of allowed property names.
 *
 * <p>Previously these parameters were passed straight into {@code Sort.by(...)}. An
 * unknown property name is not rejected by Spring Data until query construction, at
 * which point it raises a {@code PropertyReferenceException} that the global handler
 * renders as a 500. Any caller could therefore turn a list endpoint into a server
 * error with {@code ?sortBy=anything}. Validating here turns that into a clear 400
 * naming the fields that are actually sortable.
 */
public final class SortWhitelist {

    private SortWhitelist() {
    }

    /**
     * @param sortBy   requested property name, may be null/blank
     * @param sortDir  "asc" or anything else (treated as descending, preserving the
     *                 previous behaviour of these endpoints)
     * @param allowed  property names this endpoint permits sorting by
     * @param fallback property used when {@code sortBy} is null or blank; must be in
     *                 {@code allowed}
     */
    public static Sort resolve(String sortBy, String sortDir, Set<String> allowed, String fallback) {
        String property = (sortBy == null || sortBy.isBlank()) ? fallback : sortBy;

        if (!allowed.contains(property)) {
            throw new IllegalArgumentException("Cannot sort by '" + property
                    + "'. Allowed values: " + String.join(", ", allowed.stream().sorted().toList()));
        }

        return "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(property).ascending()
                : Sort.by(property).descending();
    }
}
