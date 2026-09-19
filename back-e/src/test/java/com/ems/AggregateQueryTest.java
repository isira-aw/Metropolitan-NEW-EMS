package com.ems;

import com.ems.entity.Generator;
import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.JobCardType;
import com.ems.entity.JobStatus;
import com.ems.entity.MainTicket;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import com.ems.entity.UserRole;
import com.ems.repository.EmployeeDayAttendanceRepository;
import com.ems.repository.GeneratorRepository;
import com.ems.repository.MainTicketRepository;
import com.ems.repository.MiniJobCardRepository;
import com.ems.repository.UserRepository;
import com.ems.service.ReportService;
import com.ems.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the fix for the production 502/restart loop.
 *
 * <p>The backend was being killed on heap exhaustion and restarted. The cause was that
 * statistics endpoints loaded {@link MiniJobCard} entities in bulk, and a MiniJobCard
 * carries {@code imageUrl} - a multi-megabyte base64 photo in a plain, eagerly fetched
 * column. {@code @JsonIgnore} keeps that photo out of the response but cannot stop
 * Hibernate reading it, so the rows had to be materialised in the heap regardless.
 *
 * <p>These tests assert two separate things, and both matter:
 * <ul>
 *   <li><b>The numbers did not change.</b> Each aggregate is checked against a value
 *       worked out by hand from the fixture, so a query that is fast but wrong fails.</li>
 *   <li><b>No entities are materialised.</b> Hibernate's own statistics are used to
 *       assert an entity load count of zero across the calendar and dashboard calls.
 *       This is the property that actually keeps the photos out of the heap; a future
 *       change that quietly reintroduces a {@code findAll()} fails here even though
 *       the numbers would still come out right.</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("boottest")
@Transactional
class AggregateQueryTest {

    /** Stands in for a real job-card photo, so the fixture has something to not load. */
    private static final String FAKE_PHOTO = "data:image/jpeg;base64," + "A".repeat(4096);

    @Autowired private EntityManager entityManager;
    @Autowired private TicketService ticketService;
    @Autowired private ReportService reportService;
    @Autowired private UserRepository userRepository;
    @Autowired private GeneratorRepository generatorRepository;
    @Autowired private MainTicketRepository mainTicketRepository;
    @Autowired private MiniJobCardRepository miniJobCardRepository;
    @Autowired private EmployeeDayAttendanceRepository attendanceRepository;
    @Autowired private ObjectMapper objectMapper;

    private User alice;
    private User bob;
    private MainTicket pendingTicket;

    // The context seeds an admin account, so every assertion is made against a
    // baseline captured before this fixture is written rather than an absolute number.
    private long baseEmployees;
    private long baseActiveEmployees;
    private long baseTickets;
    private long basePendingTickets;
    private long baseCompletedTickets;
    private long baseGenerators;
    private long basePendingApprovals;

    private LocalDate today;
    private LocalDate dayOne;
    private LocalDate dayTwo;

    @BeforeEach
    void setUp() {
        baseEmployees = userRepository.countByRole(UserRole.EMPLOYEE);
        baseActiveEmployees = userRepository.countByRoleAndActive(UserRole.EMPLOYEE, true);
        baseTickets = mainTicketRepository.count();
        basePendingTickets = mainTicketRepository.countByStatus(JobStatus.PENDING);
        baseCompletedTickets = mainTicketRepository.countByStatus(JobStatus.COMPLETED);
        baseGenerators = generatorRepository.count();
        basePendingApprovals = miniJobCardRepository.countByStatusAndApproved(JobStatus.COMPLETED, false);

        today = LocalDate.now();
        // Two distinct days inside the current month, chosen so the month never
        // straddles a boundary regardless of when the suite runs.
        dayOne = today.withDayOfMonth(1);
        dayTwo = today.withDayOfMonth(2);

        alice = persistEmployee("alice", true);
        bob = persistEmployee("bob", false);

        Generator generator = new Generator();
        generator.setModel("GX-100");
        generator.setName("Roof Unit");
        generator.setLocationName("HQ");
        generatorRepository.save(generator);

        pendingTicket = persistTicket(generator, "T-PENDING", JobStatus.PENDING);
        MainTicket completedTicket = persistTicket(generator, "T-DONE", JobStatus.COMPLETED);

        // Three unreviewed cards on dayOne, one on dayTwo, so the calendar has two
        // entries with different counts.
        persistCard(alice, pendingTicket, JobStatus.COMPLETED, false, dayOne, 60);
        persistCard(alice, pendingTicket, JobStatus.COMPLETED, false, dayOne, 30);
        persistCard(bob, completedTicket, JobStatus.COMPLETED, false, dayOne, 15);
        persistCard(alice, completedTicket, JobStatus.COMPLETED, false, dayTwo, 45);

        // Already approved - must not appear in the calendar or in pendingApprovals.
        persistCard(alice, completedTicket, JobStatus.COMPLETED, true, dayOne, 90);
        // Not completed - likewise excluded.
        persistCard(bob, pendingTicket, JobStatus.STARTED, false, dayTwo, 0);

        persistAttendance(alice, dayOne, 480, 30, 45);
        persistAttendance(bob, dayOne, 400, null, 20);

        entityManager.flush();
        entityManager.clear();
    }

    // ---------------------------------------------------------------- calendar

    @Test
    void approvalsCalendarReturnsTheSameCountsAsBefore() {
        Map<LocalDate, Long> calendar =
                ticketService.getPendingApprovalsCalendar(today.getYear(), today.getMonthValue());

        // Three unreviewed cards ended on dayOne, one on dayTwo. The approved card and
        // the STARTED card are excluded, as they were by the previous implementation.
        assertThat(calendar).containsEntry(dayOne, 3L);
        assertThat(calendar).containsEntry(dayTwo, 1L);
    }

    @Test
    void approvalsCalendarOmitsDaysWithNothingPending() {
        Map<LocalDate, Long> calendar =
                ticketService.getPendingApprovalsCalendar(today.getYear(), today.getMonthValue());

        // A GROUP BY emits no group for an empty day, which is the "only dates with
        // count > 0" contract the endpoint has always had.
        assertThat(calendar).doesNotContainKey(today.withDayOfMonth(28));
    }

    @Test
    void approvalsCalendarIgnoresOtherMonths() {
        LocalDate otherMonth = today.minusMonths(1);
        Map<LocalDate, Long> calendar =
                ticketService.getPendingApprovalsCalendar(otherMonth.getYear(), otherMonth.getMonthValue());

        assertThat(calendar).doesNotContainKey(dayOne);
        assertThat(calendar).doesNotContainKey(dayTwo);
    }

    @Test
    void approvalsCalendarLoadsNoEntitiesAndThereforeNoImages() {
        Statistics statistics = statistics();
        statistics.clear();

        ticketService.getPendingApprovalsCalendar(today.getYear(), today.getMonthValue());

        // Zero entities materialised means zero imageUrl values read. This is the
        // assertion that would catch a regression back to loading job cards.
        assertThat(statistics.getEntityLoadCount())
                .as("approvals calendar must aggregate in the database, not load job cards")
                .isZero();
    }

    // --------------------------------------------------------------- dashboard

    @Test
    void dashboardStatisticsReturnTheSameNumbersAsBefore() {
        Map<String, Object> stats = reportService.getDashboardStatistics();

        assertThat(stats.get("totalEmployees")).isEqualTo(baseEmployees + 2);
        // bob is inactive, so only alice adds to the active count.
        assertThat(stats.get("activeEmployees")).isEqualTo(baseActiveEmployees + 1);
        assertThat(stats.get("totalGenerators")).isEqualTo(baseGenerators + 1);
        assertThat(stats.get("totalTickets")).isEqualTo(baseTickets + 2);
        assertThat(stats.get("pendingTickets")).isEqualTo(basePendingTickets + 1);
        assertThat(stats.get("completedTickets")).isEqualTo(baseCompletedTickets + 1);
        assertThat(stats.get("pendingApprovals")).isEqualTo(basePendingApprovals + 4);
    }

    @Test
    void dashboardStatisticsSumAttendanceWithNullsCountedAsZero() {
        Map<String, Object> stats = reportService.getDashboardStatistics();

        // 480 + 400 worked.
        assertThat(stats.get("totalWorkMinutesThisMonth")).isEqualTo(880L);
        // alice 30 + 45, bob null + 20. A null morning OT must not discard bob's
        // evening OT, which is how the previous field-by-field accumulation behaved.
        assertThat(stats.get("totalOTMinutesThisMonth")).isEqualTo(95L);
    }

    @Test
    void dashboardStatisticsKeepTheirResponseKeys() {
        assertThat(reportService.getDashboardStatistics()).containsOnlyKeys(
                "totalEmployees", "activeEmployees", "totalGenerators", "totalTickets",
                "pendingTickets", "completedTickets", "pendingApprovals",
                "totalWorkMinutesThisMonth", "totalOTMinutesThisMonth");
    }

    @Test
    void dashboardStatisticsLoadNoEntitiesAndThereforeNoImages() {
        Statistics statistics = statistics();
        statistics.clear();

        reportService.getDashboardStatistics();

        assertThat(statistics.getEntityLoadCount())
                .as("dashboard statistics must aggregate in the database, not load tables")
                .isZero();
    }

    // -------------------------------------------------------- approval totals

    @Test
    void approvalStatisticsAreCountedInTheDatabase() {
        Statistics statistics = statistics();
        statistics.clear();

        Map<String, Object> stats = ticketService.getApprovalStatistics();

        assertThat(stats.get("pendingApprovals")).isEqualTo(basePendingApprovals + 4);
        assertThat(stats.get("approvedJobs")).isEqualTo(1L);
        assertThat(statistics.getEntityLoadCount()).isZero();
    }

    // ------------------------------------------------------- image protection

    @Test
    void jobCardStillHidesTheImageAndStillReportsThatItHasOne() throws Exception {
        MiniJobCard card = miniJobCardRepository
                .findByStatusAndApprovedAndEndTimeBetween(
                        JobStatus.COMPLETED, false,
                        dayOne.atStartOfDay(), dayOne.plusDays(1).atStartOfDay())
                .get(0);

        String json = objectMapper.writeValueAsString(card);

        assertThat(json).doesNotContain(FAKE_PHOTO);
        assertThat(json).doesNotContain("imageUrl");
        assertThat(json).contains("\"hasImage\":true");
    }

    // ------------------------------------------------------------------ setup

    private Statistics statistics() {
        return entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
    }

    private User persistEmployee(String username, boolean active) {
        User user = new User();
        user.setUsername(username + "-" + System.nanoTime());
        user.setPassword("x");
        user.setFullName(username);
        user.setRole(UserRole.EMPLOYEE);
        user.setActive(active);
        user.setEmail(user.getUsername() + "@example.com");
        return userRepository.save(user);
    }

    private MainTicket persistTicket(Generator generator, String number, JobStatus status) {
        MainTicket ticket = new MainTicket();
        ticket.setTicketNumber(number + "-" + System.nanoTime());
        ticket.setGenerator(generator);
        ticket.setTitle("Service");
        ticket.setType(JobCardType.SERVICE);
        ticket.setWeight(3);
        ticket.setStatus(status);
        ticket.setScheduledDate(today);
        ticket.setScheduledTime(LocalTime.of(9, 0));
        ticket.setCreatedBy("tester");
        return mainTicketRepository.save(ticket);
    }

    private void persistCard(User employee, MainTicket ticket, JobStatus status,
                             boolean approved, LocalDate endDay, int workMinutes) {
        MiniJobCard card = new MiniJobCard();
        card.setEmployee(employee);
        card.setMainTicket(ticket);
        card.setStatus(status);
        card.setApproved(approved);
        card.setWorkMinutes(workMinutes);
        card.setStartTime(endDay.atTime(8, 0));
        card.setEndTime(endDay.atTime(12, 0));
        card.setImageUrl(FAKE_PHOTO);
        miniJobCardRepository.save(card);
    }

    private void persistAttendance(User employee, LocalDate date, Integer workMinutes,
                                   Integer morningOt, Integer eveningOt) {
        EmployeeDayAttendance attendance = new EmployeeDayAttendance();
        attendance.setEmployee(employee);
        attendance.setDate(date);
        attendance.setTotalWorkMinutes(workMinutes);
        attendance.setMorningOtMinutes(morningOt);
        attendance.setEveningOtMinutes(eveningOt);
        attendance.setUniqueKey(employee.getId() + "-" + date);
        attendanceRepository.save(attendance);
    }
}
