package com.templeregistry.service.impl.dc;

import com.opencsv.CSVWriter;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.service.dc.NotificationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Separate Spring bean for @Async export execution.
 *
 * dc_e2e Section S10: @Async MUST live on a separate bean, not on ExportServiceImpl itself.
 * Self-invocation (this.doExport()) would bypass Spring's AOP proxy, making @Async a no-op
 * and blocking the HTTP thread for large exports.
 *
 * Uses exportExecutor from AsyncConfig (bounded: corePool=2, max=5, queue=10, AbortPolicy).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncExportBean {

    private static final int EXPORT_BATCH_SIZE = 200;

    private final TempleSearchSummaryRepository summaryRepository;
    private final NotificationEventPublisher notificationPublisher;

    @Value("${trm.export.base-dir:/data/exports}")
    private String exportBaseDir;

    /**
     * Async temple export: writes CSV to filesystem and notifies DC via in-app notification.
     * Runs on exportExecutor thread pool.
     */
    @Async("exportExecutor")
    @Transactional(readOnly = true)
    public void exportTemplesAsync(String jobId, Long districtId, Long recipientUserId) {
        Path outputPath = resolveOutputPath(jobId, "csv");
        log.info("Async temple export started: jobId={} districtId={}", jobId, districtId);

        try {
            ensureExportDirectory();
            writeTemplesCsv(outputPath, districtId);

            notificationPublisher.publish(
                    recipientUserId, "EXPORT_READY", districtId, "EXPORT_JOB");

            log.info("Async temple export completed: jobId={}", jobId);

        } catch (Exception e) {
            log.error("Async temple export failed: jobId={} error={}", jobId, e.getMessage(), e);
            // Do not rethrow — the calling HTTP thread has already returned 202.
            // Failure is visible only in logs; a retry mechanism is out of DC module scope.
        }
    }

    /**
     * Async declaration export: writes CSV to filesystem and notifies DC on completion.
     */
    @Async("exportExecutor")
    @Transactional(readOnly = true)
    public void exportDeclarationsAsync(String jobId, Long districtId, Long recipientUserId) {
        Path outputPath = resolveOutputPath(jobId, "csv");
        log.info("Async declaration export started: jobId={} districtId={}", jobId, districtId);

        try {
            ensureExportDirectory();
            writeDeclarationsCsv(outputPath, districtId);

            notificationPublisher.publish(
                    recipientUserId, "EXPORT_READY", districtId, "EXPORT_JOB");

            log.info("Async declaration export completed: jobId={}", jobId);

        } catch (Exception e) {
            log.error("Async declaration export failed: jobId={} error={}", jobId, e.getMessage(), e);
        }
    }

    // ─── Package-visible for sync path in DcExportServiceImpl ────────────────

    void writeTemplesCsv(Path outputPath, Long districtId) throws IOException {
        try (CSVWriter writer = new CSVWriter(new FileWriter(outputPath.toFile()))) {
            writer.writeNext(new String[]{
                    "Temple ID", "Name", "Registration Number", "Grade",
                    "Primary Deity", "Tradition", "District ID", "Temple Status",
                    "Trust Registered", "Pending Declarations", "Overdue Declarations"
            });

            int page = 0;
            List<TempleSearchSummary> batch;
            do {
                batch = districtId != null
                        ? summaryRepository.findAllByDistrictId(districtId, PageRequest.of(page, EXPORT_BATCH_SIZE)).getContent()
                        : summaryRepository.findAll(PageRequest.of(page, EXPORT_BATCH_SIZE)).getContent();

                for (TempleSearchSummary s : batch) {
                    writer.writeNext(new String[]{
                            str(s.getTempleId()), s.getName(), s.getRegistrationNumber(),
                            s.getGrade(), s.getPrimaryDeity(),
                            s.getTradition(), str(s.getDistrictId()),
                            s.getTempleStatus(),
                            String.valueOf(s.isTrustRegistered()),
                            str(s.getPendingDeclarations()),
                            str(s.getOverdueDeclarations())
                    });
                }
                page++;
            } while (batch.size() == EXPORT_BATCH_SIZE);
        }
    }

    void writeDeclarationsCsv(Path outputPath, Long districtId) throws IOException {
        // Declarations export delegates to summary repository for district-scoped overview.
        // Full declaration detail export is a future enhancement (requires JOIN or streaming JDBC).
        try (CSVWriter writer = new CSVWriter(new FileWriter(outputPath.toFile()))) {
            writer.writeNext(new String[]{
                    "Temple ID", "Name", "District ID",
                    "Pending Declarations", "Overdue Declarations", "Has Approved Declaration"
            });

            int page = 0;
            List<TempleSearchSummary> batch;
            do {
                batch = districtId != null
                        ? summaryRepository.findAllByDistrictId(districtId, PageRequest.of(page, EXPORT_BATCH_SIZE)).getContent()
                        : summaryRepository.findAll(PageRequest.of(page, EXPORT_BATCH_SIZE)).getContent();

                for (TempleSearchSummary s : batch) {
                    writer.writeNext(new String[]{
                            str(s.getTempleId()), s.getName(), str(s.getDistrictId()),
                            str(s.getPendingDeclarations()),
                            str(s.getOverdueDeclarations()),
                            String.valueOf(s.isHasApprovedDeclaration())
                    });
                }
                page++;
            } while (batch.size() == EXPORT_BATCH_SIZE);
        }
    }

    long countTemples(Long districtId) {
        return summaryRepository.countByDistrict(districtId);
    }

    long countDeclarations(Long districtId) {
        return summaryRepository.countByDistrict(districtId);
    }

    Path resolveOutputPath(String jobId, String extension) {
        return Paths.get(exportBaseDir, jobId + "." + extension);
    }

    private void ensureExportDirectory() throws IOException {
        Path dir = Paths.get(exportBaseDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
