package com.ems.dto;

/**
 * Minimal employee representation for dropdowns and filter selects.
 *
 * <p>Those controls previously loaded full User entities with a hard page size of
 * 100 or 1000, which both truncated silently once an organisation grew past the cap
 * and shipped far more per row than a picker needs. This carries only what a picker
 * renders, so the whole list stays small enough to send in one response.
 *
 * @param id                 user id
 * @param fullName           display name
 * @param email              shown alongside the name in the work-report picker, so
 *                           it is included to keep that screen looking as it did
 * @param active             whether the account is active - callers that show
 *                           inactive staff (e.g. the logs filter) need to
 *                           distinguish them
 * @param hasProfilePicture  denormalized flag so avatars know whether a photo is
 *                           worth fetching; the image itself is never included
 */
public record EmployeeOptionDTO(Long id, String fullName, String email, Boolean active,
                                Boolean hasProfilePicture) {
}
