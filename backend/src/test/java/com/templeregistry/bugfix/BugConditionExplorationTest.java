package com.templeregistry.bugfix;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.Trust;
import jakarta.persistence.Column;
import net.jqwik.api.*;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;

/**
 * Bug Condition Exploration Tests — Backend Domain Model Cleanup
 *
 * These tests encode the EXPECTED (fixed) behavior for all six bug conditions.
 * They MUST FAIL on unfixed code — failure confirms the bugs exist.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11,
 *            1.12, 1.13, 1.14, 1.15, 1.16, 1.17
 */
class BugConditionExplorationTest {

    // ─── Sub-property 1a — Flyway Duplicate Detection ────────────────────────

    /**
     * Sub-property 1a — Validates: Requirements 1.1, 1.12, 1.13, 1.14, 1.15
     *
     * Scans the Flyway migration directory and asserts that each version number
     * V34 through V39 has exactly ONE migration file.
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: 6 duplicate version pairs exist:
     *   V34__fix_malformed_photo_urls.sql  AND  V34__update_trust_type_enum.sql
     *   V35__fix_and_enhance_employees_table.sql  AND  V35__governance_status_model.sql
     *   V36__remove_governance_columns_from_staff_contractors.sql  AND  V36__update_contractor_enums.sql
     *   V37__create_governance_action_history.sql  AND  V37__rename_contractor_company_name_to_name.sql
     *   V38__enhance_asset_declaration_module.sql  AND  V38__harden_trust_module.sql
     *   V39__complete_asset_declaration_schema.sql  AND  V39__fix_trust_module_production.sql
     */
    @Test
    void subProperty1a_flywayMigrationDirectoryHasExactlyOneFilePerVersion() throws Exception {
        // Locate the migration directory relative to the project root
        Path migrationDir = findMigrationDirectory();
        assertThat(migrationDir)
                .as("Migration directory backend/src/main/resources/db/migration must exist")
                .isNotNull();

        // Collect all .sql files and group by version number
        List<Path> sqlFiles;
        try (Stream<Path> stream = Files.list(migrationDir)) {
            sqlFiles = stream
                    .filter(p -> p.getFileName().toString().endsWith(".sql"))
                    .collect(Collectors.toList());
        }

        // Extract version number from filename (e.g. "V34" from "V34__fix_malformed_photo_urls.sql")
        Map<String, List<String>> filesByVersion = new LinkedHashMap<>();
        for (Path file : sqlFiles) {
            String filename = file.getFileName().toString();
            if (filename.matches("V\\d+__.*\\.sql")) {
                String version = filename.substring(0, filename.indexOf("__"));
                filesByVersion.computeIfAbsent(version, k -> new ArrayList<>()).add(filename);
            }
        }

        // Assert exactly one file per version V34–V39
        List<String> versionsWithDuplicates = new ArrayList<>();
        for (int v = 34; v <= 39; v++) {
            String versionKey = "V" + v;
            List<String> filesForVersion = filesByVersion.getOrDefault(versionKey, Collections.emptyList());
            if (filesForVersion.size() != 1) {
                versionsWithDuplicates.add(versionKey + " → " + filesForVersion);
            }
        }

        assertThat(versionsWithDuplicates)
                .as("FIX 1a: Each Flyway version V34–V39 must have exactly ONE migration file. " +
                    "Duplicate versions cause FlywayException: Found more than one migration with version X. " +
                    "Merge each conflicting pair into a single numbered file (V45–V50).")
                .isEmpty();
    }

    // ─── Sub-property 1b — Employee Wrong Enum ───────────────────────────────

    /**
     * Sub-property 1b — Validates: Requirements 1.2, 1.3
     *
     * Constructs an Employee with submissionStatus = governance.SubmissionStatus.SUBMITTED
     * and asserts that the field type IS governance.SubmissionStatus (not employee.SubmissionStatus).
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: Employee.submissionStatus is of type employee.SubmissionStatus
     * (which has PENDING_REVIEW), not governance.SubmissionStatus (which has SUBMITTED).
     * Cross-module status checks silently return wrong results.
     */
    @Test
    void subProperty1b_employeeSubmissionStatusIsGovernanceType() throws Exception {
        // On FIXED code: Employee.submissionStatus field was removed entirely (Phase 0).
        // Assert that the submissionStatus field does NOT exist on Employee.
        assertThat(hasField(Employee.class, "submissionStatus"))
                .as("FIX 1b: Employee must NOT have a submissionStatus field. " +
                    "Employee governance is handled by WorkflowInstance only.")
                .isFalse();
    }

    // ─── Sub-property 1c — Trust Contradiction ───────────────────────────────

    /**
     * Sub-property 1c — Validates: Requirements 1.4, 1.5
     *
     * Constructs a Trust with isVerifiedByDc = true AND dcDecisionStatus = PENDING_DC_APPROVAL
     * and asserts that isBugCondition returns true (i.e. the entity is in a contradictory state
     * and the system has no guard to prevent it).
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: Trust can be constructed with isVerifiedByDc = true AND
     * dcDecisionStatus = PENDING_DC_APPROVAL simultaneously — no compile-time or runtime guard exists.
     * The isBugCondition check returns true, but the assertion expects it to be false (fixed state).
     */
    @Test
    void subProperty1c_trustCannotHaveContradictoryIsVerifiedAndPendingDecisionStatus() throws Exception {
        // On FIXED code: Trust should NOT have isVerifiedByDc or dcDecisionStatus fields at all.
        // Both are removed — state lives exclusively in WorkflowInstance.
        assertThat(hasField(Trust.class, "isVerifiedByDc"))
                .as("FIX 1c: Trust must NOT have an isVerifiedByDc field. " +
                    "DC verification state derives exclusively from WorkflowInstance status.")
                .isFalse();

        assertThat(hasField(Trust.class, "dcDecisionStatus"))
                .as("FIX 1c: Trust must NOT have a dcDecisionStatus field. " +
                    "DC decision state lives exclusively in WorkflowInstance.")
                .isFalse();
    }

    // ─── Sub-property 1d — Temple Contradiction ──────────────────────────────

    /**
     * Sub-property 1d — Validates: Requirements 1.6, 1.7
     *
     * Constructs a Temple with isVerifiedByDc = true AND isFlaggedByDc = true
     * and asserts that isBugCondition returns true (logically contradictory state).
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: Temple can be constructed with isVerifiedByDc = true AND isFlaggedByDc = true
     * simultaneously — a temple cannot be both verified and flagged at the same time.
     */
    @Test
    void subProperty1d_templeCannotBeSimultaneouslyVerifiedAndFlagged() throws Exception {
        // Construct Temple in contradictory state
        Temple temple = Temple.builder()
                .registrationNumber("T-001")
                .name("Test Temple")
                .grade(com.templeregistry.entity.temple.TempleGrade.A)
                .primaryDeity("Test Deity")
                .districtId(1L)
                .version(1L)
                .build();

        // Set both boolean flags to true via reflection (only possible on unfixed code)
        // On fixed code, these fields don't exist — the try-catch handles that gracefully
        try {
            setFieldValue(temple, "isVerifiedByDc", true);
            setFieldValue(temple, "isFlaggedByDc", true);

            // Verify the contradictory state was accepted (no guard exists on unfixed code)
            boolean isVerifiedByDc = getFieldValue(temple, "isVerifiedByDc", Boolean.class);
            boolean isFlaggedByDc = getFieldValue(temple, "isFlaggedByDc", Boolean.class);

            boolean isBugCondition = isVerifiedByDc && isFlaggedByDc;
        } catch (NoSuchFieldException e) {
            // Fields don't exist — this is the expected post-fix state.
            // The assertions below will confirm the fields are absent.
        }

        // On FIXED code: Temple should NOT have isVerifiedByDc or isFlaggedByDc fields at all.
        // Assert that neither field exists on Temple (both deleted in fix).
        boolean hasIsVerifiedByDc = hasField(Temple.class, "isVerifiedByDc");
        boolean hasIsFlaggedByDc = hasField(Temple.class, "isFlaggedByDc");

        assertThat(hasIsVerifiedByDc)
                .as("FIX 1d: Temple must NOT have an isVerifiedByDc field. " +
                    "isVerifiedByDc=true AND isFlaggedByDc=true can coexist (logically contradictory). " +
                    "Remove isVerifiedByDc from Temple; use verificationStatus exclusively.")
                .isFalse();

        assertThat(hasIsFlaggedByDc)
                .as("FIX 1d: Temple must NOT have an isFlaggedByDc field. " +
                    "isVerifiedByDc=true AND isFlaggedByDc=true can coexist (logically contradictory). " +
                    "Remove isFlaggedByDc from Temple; use verificationStatus exclusively.")
                .isFalse();
    }

    // ─── Sub-property 1e — AssetDeclaration Parallel Machines ────────────────

    /**
     * Sub-property 1e — Validates: Requirements 1.8, 1.9
     *
     * Constructs an AssetDeclaration with status = APPROVED AND dcDecisionStatus = PENDING_DC_APPROVAL
     * and asserts that isBugCondition returns true (diverged parallel state machines).
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: AssetDeclaration can hold status=APPROVED AND dcDecisionStatus=PENDING_DC_APPROVAL
     * simultaneously — three independent state machines (status, submissionStatus, dcDecisionStatus)
     * can diverge with no enforced consistency.
     */
    @Test
    void subProperty1e_assetDeclarationCannotHaveDivergedStatusAndDcDecisionStatus() throws Exception {
        // On FIXED code: AssetDeclaration should NOT have dcDecisionStatus field at all.
        // Assert that dcDecisionStatus field does NOT exist on AssetDeclaration (deleted in fix).
        assertThat(hasField(AssetDeclaration.class, "dcDecisionStatus"))
                .as("FIX 1e: AssetDeclaration must NOT have a dcDecisionStatus field. " +
                    "status=APPROVED AND dcDecisionStatus=PENDING_DC_APPROVAL can coexist " +
                    "(three parallel state machines diverge). " +
                    "Remove dcDecisionStatus from AssetDeclaration; use status (DeclarationStatus) exclusively.")
                .isFalse();

        assertThat(hasField(AssetDeclaration.class, "submissionStatus"))
                .as("FIX 1e: AssetDeclaration must NOT have a submissionStatus field. " +
                    "Remove submissionStatus from AssetDeclaration; use status (DeclarationStatus) exclusively.")
                .isFalse();
    }

    // ─── Sub-property 1f — Employee Dropped Columns ──────────────────────────

    /**
     * Sub-property 1f — Validates: Requirements 1.11, 1.17
     *
     * Checks that the Employee entity does NOT map any columns that were physically
     * dropped from the employees table by migration V36
     * (submission_status, system_verification_status, dc_decision_status,
     *  send_back_reason, governance_version).
     *
     * Additionally verifies that the Employee entity does NOT reference the
     * duplicate employee.SubmissionStatus enum (which has PENDING_REVIEW).
     *
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
     * Counterexample: Employee.submissionStatus maps to column "submission_status" using
     * employee.SubmissionStatus (wrong enum type). V36 dropped submission_status from employees,
     * so persisting an Employee would throw SQLSyntaxErrorException: Unknown column 'submission_status'.
     * Also, employee.SubmissionStatus still exists as a class (duplicate enum).
     */
    @Test
    void subProperty1f_employeeEntityDoesNotMapDroppedGovernanceColumns() throws Exception {
        // Columns dropped by V36 from the employees table
        List<String> droppedColumns = List.of(
                "submission_status",
                "system_verification_status",
                "dc_decision_status",
                "send_back_reason",
                "governance_version"
        );

        // Collect all @Column(name=...) mappings from Employee entity fields
        List<String> mappedColumns = new ArrayList<>();
        for (Field field : getAllFields(Employee.class)) {
            Column columnAnnotation = field.getAnnotation(Column.class);
            if (columnAnnotation != null && !columnAnnotation.name().isEmpty()) {
                mappedColumns.add(columnAnnotation.name().toLowerCase());
            }
        }

        // Assert none of the dropped columns are still mapped
        List<String> stillMappedDroppedColumns = droppedColumns.stream()
                .filter(mappedColumns::contains)
                .collect(Collectors.toList());

        assertThat(stillMappedDroppedColumns)
                .as("FIX 1f: Employee entity must NOT map columns dropped by V36: %s. " +
                    "These columns no longer exist in the employees table. " +
                    "Remove fields systemVerificationStatus, dcDecisionStatus, sendBackReason, " +
                    "governanceVersion from Employee entity. " +
                    "Also change submissionStatus type from employee.SubmissionStatus to " +
                    "governance.SubmissionStatus (PENDING_REVIEW → SUBMITTED).",
                    droppedColumns)
                .isEmpty();

        // Additionally assert that the duplicate employee.SubmissionStatus enum class no longer exists
        assertThatCode(() -> Class.forName("com.templeregistry.entity.employee.SubmissionStatus"))
                .as("FIX 1f: com.templeregistry.entity.employee.SubmissionStatus must be deleted. " +
                    "This duplicate enum (with PENDING_REVIEW) causes ambiguous imports and " +
                    "mismatched state transitions. Use governance.SubmissionStatus exclusively.")
                .isInstanceOf(ClassNotFoundException.class);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────────

    /**
     * Finds the Flyway migration directory by searching from the current working directory
     * and common project root locations.
     */
    private Path findMigrationDirectory() {
        // Try relative paths from common working directories
        List<String> candidates = List.of(
                "backend/src/main/resources/db/migration",
                "src/main/resources/db/migration",
                "../backend/src/main/resources/db/migration"
        );
        for (String candidate : candidates) {
            Path path = Paths.get(candidate);
            if (Files.isDirectory(path)) {
                return path;
            }
        }
        // Try from system property or environment
        String userDir = System.getProperty("user.dir");
        if (userDir != null) {
            // If running from backend/ directory
            Path fromBackend = Paths.get(userDir, "src/main/resources/db/migration");
            if (Files.isDirectory(fromBackend)) {
                return fromBackend;
            }
            // If running from project root
            Path fromRoot = Paths.get(userDir, "backend/src/main/resources/db/migration");
            if (Files.isDirectory(fromRoot)) {
                return fromRoot;
            }
        }
        return null;
    }

    /**
     * Checks whether a class declares a field with the given name (including inherited fields).
     */
    private boolean hasField(Class<?> clazz, String fieldName) {
        for (Field field : getAllFields(clazz)) {
            if (field.getName().equals(fieldName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns all declared fields from a class and its superclasses.
     */
    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            fields.addAll(Arrays.asList(current.getDeclaredFields()));
            current = current.getSuperclass();
        }
        return fields;
    }

    /**
     * Sets a field value via reflection, bypassing access modifiers.
     */
    private void setFieldValue(Object target, String fieldName, Object value) throws Exception {
        Field field = findField(target.getClass(), fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    /**
     * Gets a field value via reflection, bypassing access modifiers.
     */
    @SuppressWarnings("unchecked")
    private <T> T getFieldValue(Object target, String fieldName, Class<T> type) throws Exception {
        Field field = findField(target.getClass(), fieldName);
        field.setAccessible(true);
        return (T) field.get(target);
    }

    /**
     * Finds a field by name in a class hierarchy.
     */
    private Field findField(Class<?> clazz, String fieldName) throws NoSuchFieldException {
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        throw new NoSuchFieldException("Field '" + fieldName + "' not found in " + clazz.getName() + " or its superclasses");
    }
}
