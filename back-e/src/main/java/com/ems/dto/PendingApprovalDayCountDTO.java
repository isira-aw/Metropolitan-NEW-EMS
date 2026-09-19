package com.ems.dto;

import java.time.LocalDate;

/**
 * One day's pending-approval count, aggregated by the database.
 *
 * <p>Exists so the approvals calendar can be built without loading a single
 * {@link com.ems.entity.MiniJobCard} entity. That endpoint used to select every
 * unreviewed job card in the month - each carrying a multi-megabyte base64 photo in
 * {@code imageUrl} - purely to count them per day. {@code @JsonIgnore} keeps the photo
 * out of the response but does not stop Hibernate reading the column, so the rows still
 * had to be materialised in the heap first. A month with a normal number of pending
 * cards was enough to exhaust the container's heap and have it killed and restarted,
 * which is what produced the production 502 bursts.
 *
 * <p>The date is carried as its three components rather than a {@code LocalDate}
 * because that is what {@code YEAR()/MONTH()/DAY()} return in a GROUP BY, and grouping
 * on those is portable across PostgreSQL and the H2 database the tests run against.
 *
 * @param year  calendar year of the job card's endTime
 * @param month calendar month (1-12) of the job card's endTime
 * @param day   day of month (1-31) of the job card's endTime
 * @param count number of unreviewed job cards whose endTime falls on that day
 */
public record PendingApprovalDayCountDTO(Integer year, Integer month, Integer day, Long count) {

    /**
     * The grouped day as a {@link LocalDate}, which is the key shape the calendar
     * endpoint has always returned.
     */
    public LocalDate date() {
        return LocalDate.of(year, month, day);
    }
}
