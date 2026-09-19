package com.ems;

import com.ems.entity.JobStatus;
import com.ems.repository.EmployeeDayAttendanceRepository;
import com.ems.repository.MainTicketRepository;
import com.ems.repository.MiniJobCardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Executes every query that uses the {@code :param IS NULL OR ...} optional-filter
 * pattern with all of its filters set to null.
 *
 * <p>That combination is what broke in production. PostgreSQL cannot infer a type for
 * a placeholder standing alone as {@code $n IS NULL}, and rejects the whole statement
 * with SQLSTATE 42P18 before executing it. Every affected query therefore failed for
 * exactly the callers that skipped a filter - the admin tickets screen on first load,
 * and the "all employees" performance report.
 *
 * <p><b>Known limit of this test.</b> It runs against H2, which infers parameter types
 * where PostgreSQL will not, so H2 passes both the broken and the fixed query. These
 * tests cannot prove the production fix; what they do prove is that the HQL parses,
 * that the casts are valid Hibernate cast targets, and that "null means no filter" is
 * still the semantics. The real proof is a deployment against PostgreSQL. This class
 * exists so the null-argument path is at least exercised somewhere, which is what was
 * missing when the bug shipped.
 */
@SpringBootTest
@ActiveProfiles("boottest")
@Transactional
class NullFilterQueryTest {

    @Autowired private MainTicketRepository mainTicketRepository;
    @Autowired private MiniJobCardRepository miniJobCardRepository;
    @Autowired private EmployeeDayAttendanceRepository attendanceRepository;

    @Test
    void ticketSearchRunsWithEveryFilterOmitted() {
        assertThatCode(() -> mainTicketRepository.search(
                null, null, null, null,
                PageRequest.of(0, 10, Sort.by("scheduledTime"))))
                .doesNotThrowAnyException();
    }

    @Test
    void ticketSearchRunsWithEachFilterSuppliedOnItsOwn() {
        PageRequest page = PageRequest.of(0, 10, Sort.by("scheduledTime"));

        assertThatCode(() -> mainTicketRepository.search(
                LocalDate.now(), null, null, null, page)).doesNotThrowAnyException();
        assertThatCode(() -> mainTicketRepository.search(
                null, JobStatus.PENDING, null, null, page)).doesNotThrowAnyException();
        assertThatCode(() -> mainTicketRepository.search(
                null, null, "roof", null, page)).doesNotThrowAnyException();
        assertThatCode(() -> mainTicketRepository.search(
                null, null, null, 1L, page)).doesNotThrowAnyException();
    }

    @Test
    void ticketSearchRunsWithEveryFilterSupplied() {
        assertThatCode(() -> mainTicketRepository.search(
                LocalDate.now(), JobStatus.COMPLETED, "roof", 1L,
                PageRequest.of(0, 10, Sort.by("scheduledTime"))))
                .doesNotThrowAnyException();
    }

    @Test
    void jobCardAggregateRunsForAllEmployees() {
        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1);

        assertThatCode(() -> miniJobCardRepository
                .aggregateByEmployeeForCreatedAtRange(start, end, null))
                .doesNotThrowAnyException();
        assertThatCode(() -> miniJobCardRepository
                .aggregateByEmployeeForCreatedAtRange(start, end, 1L))
                .doesNotThrowAnyException();
    }

    @Test
    void overtimeAggregateRunsForAllEmployees() {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        assertThatCode(() -> attendanceRepository.sumOtMinutesByEmployee(start, end, null))
                .doesNotThrowAnyException();
        assertThatCode(() -> attendanceRepository.sumOtMinutesByEmployee(start, end, 1L))
                .doesNotThrowAnyException();
    }
}
