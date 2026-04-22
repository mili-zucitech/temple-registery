package com.templeregistry.governance;

import com.templeregistry.dto.request.contractor.CreateContractorRequest;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.impl.contractor.ContractorServiceImpl;
import com.templeregistry.service.impl.employee.EmployeeServiceImpl;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Staff & Contractor — No DC Approval Workflow
 *
 * Enforces the strict business rule:
 *   ❌ Staff (Employee) and Contractor modules have NO DC approval workflow.
 *   ✅ Changes are effective immediately on save.
 *   ✅ DC can only verify/flag (compliance oversight), NOT approve/reject.
 *
 * Test cases:
 *   TC-CR-01: TA edits staff — saved immediately, no approval needed
 *   TC-CR-02: TA edits contractor — saved immediately, no approval needed
 *   TC-CR-03: GovernanceWorkflowService has NO employee approval methods
 *   TC-CR-04: GovernanceWorkflowService has NO contractor approval methods
 *   TC-CR-05: GovernanceWorkflowController has NO employee/contractor endpoints
 *   TC-CR-06: DC can view staff/contractor data (read-only, no approval state)
 *   TC-CR-07: EmployeeResponse has NO dcDecisionStatus / sendBackReason / submissionStatus
 *   TC-CR-08: ContractorResponse has NO dcDecisionStatus / sendBackReason / submissionStatus
 *   TC-CR-09: Audit log written on employee create
 *   TC-CR-10: Audit log written on employee update
 *   TC-CR-11: Audit log written on contractor create
 *   TC-CR-12: Audit log written on contractor update
 *   TC-CR-13: Trust and Declaration approval workflow still intact
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Staff & Contractor — No DC Approval Workflow")
class StaffContractorNoApprovalTest {

    // ── Employee service under test ───────────────────────────────────────────

    @Mock EmployeeRepository employeeRepository;
    @Mock TempleRepository templeRepository;
    @Mock OwnershipGuard ownershipGuard;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock PaginationUtil paginationUtil;
    @Mock AuditService auditService;

    @InjectMocks EmployeeServiceImpl employeeService;

    // ── Contractor service under test ─────────────────────────────────────────

    @Mock ContractorRepository contractorRepository;

    @InjectMocks ContractorServiceImpl contractorService;

    private Temple temple;
    private Employee activeEmployee;
    private Contractor contractor;

    @BeforeEach
    void setUp() {
        // Temple Authority security context
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, "TEMPLE_AUTHORITY", null, 1L, "ta_user");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, Collections.emptyList()));

        temple = Temple.builder()
                .name("Sri Rama Temple")
                .registrationNumber("REG-001")
                .districtId(1L)
                .build();
        ReflectionTestUtils.setField(temple, "id", 1L);

        activeEmployee = Employee.builder()
                .templeId(1L)
                .fullName("Govinda Dasa")
                .employeeType(EmployeeType.PRIEST)
                .designation("Head Priest")
                .status(EmployeeStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(activeEmployee, "id", 10L);

        contractor = Contractor.builder()
                .templeId(1L)
                .name("Sri Constructions Pvt Ltd")
                .serviceType("Renovation")
                .contractValue(BigDecimal.valueOf(500000))
                .build();
        ReflectionTestUtils.setField(contractor, "id", 20L);

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(anyLong());
        lenient().doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        lenient().doNothing().when(auditService).logDataEvent(
                anyLong(), anyString(), anyString(), anyString(), anyLong(), anyString());
    }

    // =========================================================================
    // TC-CR-01: TA edits staff — saved immediately, no approval needed
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-01: TA edits staff — saved immediately")
    class TaEditsStaff {

        @Test
        @DisplayName("TA can update employee and change is persisted immediately")
        void ta_updates_employee_and_change_is_persisted_immediately() {
            when(employeeRepository.findById(10L)).thenReturn(Optional.of(activeEmployee));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                    .designation("Senior Priest")
                    .build();

            EmployeeResponse response = employeeService.update(10L, rq);

            // Change persisted immediately — no approval state
            assertThat(response.getDesignation()).isEqualTo("Senior Priest");
            verify(employeeRepository).save(argThat(e -> "Senior Priest".equals(e.getDesignation())));
        }

        @Test
        @DisplayName("TA can create employee and it is immediately ACTIVE")
        void ta_creates_employee_and_it_is_immediately_active() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(employeeRepository.save(any())).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                ReflectionTestUtils.setField(e, "id", 99L);
                return e;
            });

            CreateEmployeeRequest rq = new CreateEmployeeRequest();
            ReflectionTestUtils.setField(rq, "fullName", "Rama Dasa");
            ReflectionTestUtils.setField(rq, "employeeType", EmployeeType.PRIEST);
            ReflectionTestUtils.setField(rq, "designation", "Priest");

            EmployeeResponse response = employeeService.create(1L, rq);

            // Immediately ACTIVE — no pending/draft state
            assertThat(response.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
            assertThat(response.getId()).isEqualTo(99L);
        }
    }

    // =========================================================================
    // TC-CR-02: TA edits contractor — saved immediately, no approval needed
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-02: TA edits contractor — saved immediately")
    class TaEditsContractor {

        @Test
        @DisplayName("TA can update contractor and change is persisted immediately")
        void ta_updates_contractor_and_change_is_persisted_immediately() {
            when(contractorRepository.findById(20L)).thenReturn(Optional.of(contractor));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(contractorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateContractorRequest rq = new CreateContractorRequest();
            ReflectionTestUtils.setField(rq, "name", "Sri Constructions Pvt Ltd");
            ReflectionTestUtils.setField(rq, "serviceType", "Renovation and Painting");
            ReflectionTestUtils.setField(rq, "contractValue", BigDecimal.valueOf(750000));

            ContractorResponse response = contractorService.update(20L, rq);

            assertThat(response.getServiceType()).isEqualTo("Renovation and Painting");
            assertThat(response.getContractValue()).isEqualByComparingTo(BigDecimal.valueOf(750000));
            verify(contractorRepository).save(any());
        }

        @Test
        @DisplayName("TA can create contractor and it is immediately visible")
        void ta_creates_contractor_and_it_is_immediately_visible() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(contractorRepository.save(any())).thenAnswer(inv -> {
                Contractor c = inv.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 99L);
                return c;
            });

            CreateContractorRequest rq = new CreateContractorRequest();
            ReflectionTestUtils.setField(rq, "name", "New Contractor Ltd");
            ReflectionTestUtils.setField(rq, "serviceType", "Electrical");
            ReflectionTestUtils.setField(rq, "contractValue", BigDecimal.valueOf(100000));

            ContractorResponse response = contractorService.create(1L, rq);

            assertThat(response.getId()).isEqualTo(99L);
            assertThat(response.getName()).isEqualTo("New Contractor Ltd");
        }
    }

    // =========================================================================
    // TC-CR-03 & TC-CR-04: GovernanceWorkflowService has NO Staff/Contractor methods
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-03 & TC-CR-04: No approval methods for Staff/Contractor in GovernanceWorkflowService")
    class NoApprovalMethodsInService {

        @Test
        @DisplayName("GovernanceWorkflowService has NO employee approval/submit/reject methods")
        void governance_service_has_no_employee_workflow_methods() {
            Class<?> serviceInterface =
                    com.templeregistry.service.governance.GovernanceWorkflowService.class;

            for (java.lang.reflect.Method method : serviceInterface.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowService must NOT have any employee workflow methods")
                        .doesNotContain("employee")
                        .doesNotContain("staff");
            }
        }

        @Test
        @DisplayName("GovernanceWorkflowService has NO contractor approval/submit/reject methods")
        void governance_service_has_no_contractor_workflow_methods() {
            Class<?> serviceInterface =
                    com.templeregistry.service.governance.GovernanceWorkflowService.class;

            for (java.lang.reflect.Method method : serviceInterface.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowService must NOT have any contractor workflow methods")
                        .doesNotContain("contractor");
            }
        }
    }

    // =========================================================================
    // TC-CR-05: GovernanceWorkflowController has NO Staff/Contractor endpoints
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-05: No Staff/Contractor endpoints in GovernanceWorkflowController")
    class NoEndpointsInController {

        @Test
        @DisplayName("GovernanceWorkflowController has NO employee-related endpoints")
        void governance_controller_has_no_employee_endpoints() {
            Class<?> controllerClass =
                    com.templeregistry.controller.governance.GovernanceWorkflowController.class;

            for (java.lang.reflect.Method method : controllerClass.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowController must NOT have any employee endpoints")
                        .doesNotContain("employee")
                        .doesNotContain("staff");
            }
        }

        @Test
        @DisplayName("GovernanceWorkflowController has NO contractor-related endpoints")
        void governance_controller_has_no_contractor_endpoints() {
            Class<?> controllerClass =
                    com.templeregistry.controller.governance.GovernanceWorkflowController.class;

            for (java.lang.reflect.Method method : controllerClass.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowController must NOT have any contractor endpoints")
                        .doesNotContain("contractor");
            }
        }
    }

    // =========================================================================
    // TC-CR-06: DC can view staff/contractor data (read-only, no approval state)
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-06: DC can view staff/contractor data (read-only)")
    class DcViewsData {

        @Test
        @DisplayName("DC can read employee by ID — response has no approval state fields")
        void dc_can_read_employee_without_approval_state() {
            // Switch to DC security context
            ScopeHelper.Claims dcClaims = new ScopeHelper.Claims(2L, "DISTRICT_COLLECTOR", 1L, null, "dc_user");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(dcClaims, null, Collections.emptyList()));

            when(employeeRepository.findById(10L)).thenReturn(Optional.of(activeEmployee));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));

            EmployeeResponse response = employeeService.getById(10L);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("Govinda Dasa");
            assertThat(response.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
        }

        @Test
        @DisplayName("DC can read contractor by ID — response has no approval state fields")
        void dc_can_read_contractor_without_approval_state() {
            ScopeHelper.Claims dcClaims = new ScopeHelper.Claims(2L, "DISTRICT_COLLECTOR", 1L, null, "dc_user");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(dcClaims, null, Collections.emptyList()));

            when(contractorRepository.findById(20L)).thenReturn(Optional.of(contractor));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));

            ContractorResponse response = contractorService.getById(20L);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Sri Constructions Pvt Ltd");
        }
    }

    // =========================================================================
    // TC-CR-07: EmployeeResponse has NO governance workflow fields
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-07: EmployeeResponse has NO governance workflow or verification fields")
    class EmployeeResponseHasNoWorkflowFields {

        @Test
        @DisplayName("EmployeeResponse has no dcDecisionStatus, sendBackReason, submissionStatus, isVerifiedByDc, or dcFlagReason")
        void employee_response_has_no_workflow_fields() throws Exception {
            Class<?> responseClass = Class.forName(
                    "com.templeregistry.dto.response.employee.EmployeeResponse");

            boolean hasDcDecisionStatus = false;
            boolean hasSendBackReason = false;
            boolean hasSubmissionStatus = false;
            boolean hasGovernanceVersion = false;
            boolean hasIsVerifiedByDc = false;
            boolean hasDcFlagReason = false;

            for (java.lang.reflect.Field field : responseClass.getDeclaredFields()) {
                switch (field.getName()) {
                    case "dcDecisionStatus"   -> hasDcDecisionStatus = true;
                    case "sendBackReason"     -> hasSendBackReason = true;
                    case "submissionStatus"   -> hasSubmissionStatus = true;
                    case "governanceVersion"  -> hasGovernanceVersion = true;
                    case "isVerifiedByDc"     -> hasIsVerifiedByDc = true;
                    case "dcFlagReason"       -> hasDcFlagReason = true;
                }
            }

            assertThat(hasDcDecisionStatus)
                    .as("EmployeeResponse must NOT have dcDecisionStatus — Staff has no DC approval")
                    .isFalse();
            assertThat(hasSendBackReason)
                    .as("EmployeeResponse must NOT have sendBackReason — Staff has no DC approval")
                    .isFalse();
            assertThat(hasSubmissionStatus)
                    .as("EmployeeResponse must NOT have submissionStatus — Staff has no DC approval")
                    .isFalse();
            assertThat(hasGovernanceVersion)
                    .as("EmployeeResponse must NOT have governanceVersion — Staff has no DC approval")
                    .isFalse();
            assertThat(hasIsVerifiedByDc)
                    .as("EmployeeResponse must NOT have isVerifiedByDc — verification removed from Staff")
                    .isFalse();
            assertThat(hasDcFlagReason)
                    .as("EmployeeResponse must NOT have dcFlagReason — verification removed from Staff")
                    .isFalse();
        }
    }

    // =========================================================================
    // TC-CR-08: ContractorResponse has NO governance workflow fields
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-08: ContractorResponse has NO governance workflow or verification fields")
    class ContractorResponseHasNoWorkflowFields {

        @Test
        @DisplayName("ContractorResponse has no dcDecisionStatus, sendBackReason, submissionStatus, isVerifiedByDc, or dcFlagReason")
        void contractor_response_has_no_workflow_fields() throws Exception {
            Class<?> responseClass = Class.forName(
                    "com.templeregistry.dto.response.contractor.ContractorResponse");

            boolean hasDcDecisionStatus = false;
            boolean hasSendBackReason = false;
            boolean hasSubmissionStatus = false;
            boolean hasGovernanceVersion = false;
            boolean hasIsVerifiedByDc = false;
            boolean hasDcFlagReason = false;

            for (java.lang.reflect.Field field : responseClass.getDeclaredFields()) {
                switch (field.getName()) {
                    case "dcDecisionStatus"   -> hasDcDecisionStatus = true;
                    case "sendBackReason"     -> hasSendBackReason = true;
                    case "submissionStatus"   -> hasSubmissionStatus = true;
                    case "governanceVersion"  -> hasGovernanceVersion = true;
                    case "isVerifiedByDc"     -> hasIsVerifiedByDc = true;
                    case "dcFlagReason"       -> hasDcFlagReason = true;
                }
            }

            assertThat(hasDcDecisionStatus)
                    .as("ContractorResponse must NOT have dcDecisionStatus — Contractors have no DC approval")
                    .isFalse();
            assertThat(hasSendBackReason)
                    .as("ContractorResponse must NOT have sendBackReason — Contractors have no DC approval")
                    .isFalse();
            assertThat(hasSubmissionStatus)
                    .as("ContractorResponse must NOT have submissionStatus — Contractors have no DC approval")
                    .isFalse();
            assertThat(hasGovernanceVersion)
                    .as("ContractorResponse must NOT have governanceVersion — Contractors have no DC approval")
                    .isFalse();
            assertThat(hasIsVerifiedByDc)
                    .as("ContractorResponse must NOT have isVerifiedByDc — verification removed from Contractors")
                    .isFalse();
            assertThat(hasDcFlagReason)
                    .as("ContractorResponse must NOT have dcFlagReason — verification removed from Contractors")
                    .isFalse();
        }
    }

    // =========================================================================
    // TC-CR-09 & TC-CR-10: Audit logging on employee create/update
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-09 & TC-CR-10: Audit logging for Staff edits")
    class StaffAuditLogging {

        @Test
        @DisplayName("Audit log written when employee is created")
        void audit_log_written_on_employee_create() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(employeeRepository.save(any())).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                ReflectionTestUtils.setField(e, "id", 55L);
                return e;
            });

            CreateEmployeeRequest rq = new CreateEmployeeRequest();
            ReflectionTestUtils.setField(rq, "fullName", "Audit Test Employee");
            ReflectionTestUtils.setField(rq, "employeeType", EmployeeType.PRIEST);

            employeeService.create(1L, rq);

            verify(auditService).logDataEvent(
                    eq(1L), eq("TEMPLE_AUTHORITY"), eq("CREATE"), eq("Employee"), eq(55L), anyString());
        }

        @Test
        @DisplayName("Audit log written when employee is updated")
        void audit_log_written_on_employee_update() {
            when(employeeRepository.findById(10L)).thenReturn(Optional.of(activeEmployee));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                    .designation("Updated Designation")
                    .build();

            employeeService.update(10L, rq);

            verify(auditService).logDataEvent(
                    eq(1L), eq("TEMPLE_AUTHORITY"), eq("UPDATE"), eq("Employee"), eq(10L), anyString());
        }
    }

    // =========================================================================
    // TC-CR-11 & TC-CR-12: Audit logging on contractor create/update
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-11 & TC-CR-12: Audit logging for Contractor edits")
    class ContractorAuditLogging {

        @Test
        @DisplayName("Audit log written when contractor is created")
        void audit_log_written_on_contractor_create() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(contractorRepository.save(any())).thenAnswer(inv -> {
                Contractor c = inv.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 77L);
                return c;
            });

            CreateContractorRequest rq = new CreateContractorRequest();
            ReflectionTestUtils.setField(rq, "name", "Audit Contractor");
            ReflectionTestUtils.setField(rq, "serviceType", "Plumbing");

            contractorService.create(1L, rq);

            verify(auditService).logDataEvent(
                    eq(1L), eq("TEMPLE_AUTHORITY"), eq("CREATE"), eq("Contractor"), eq(77L), anyString());
        }

        @Test
        @DisplayName("Audit log written when contractor is updated")
        void audit_log_written_on_contractor_update() {
            when(contractorRepository.findById(20L)).thenReturn(Optional.of(contractor));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(contractorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateContractorRequest rq = new CreateContractorRequest();
            ReflectionTestUtils.setField(rq, "name", "Updated Contractor Name");
            ReflectionTestUtils.setField(rq, "serviceType", "Electrical");
            ReflectionTestUtils.setField(rq, "contractValue", BigDecimal.valueOf(200000));

            contractorService.update(20L, rq);

            verify(auditService).logDataEvent(
                    eq(1L), eq("TEMPLE_AUTHORITY"), eq("UPDATE"), eq("Contractor"), eq(20L), anyString());
        }
    }

    // =========================================================================
    // TC-CR-13: Trust and Declaration approval workflow still intact
    // =========================================================================

    @Nested
    @DisplayName("TC-CR-13: Trust and Declaration approval workflow unchanged")
    class ApprovedModulesUnaffected {

        @Test
        @DisplayName("GovernanceWorkflowService still has all Trust workflow methods")
        void governance_service_still_has_trust_workflow_methods() {
            Class<?> serviceInterface =
                    com.templeregistry.service.governance.GovernanceWorkflowService.class;

            boolean hasApproveTrust = false;
            boolean hasSendBackTrust = false;
            boolean hasRejectTrust = false;
            boolean hasSubmitTrust = false;

            for (java.lang.reflect.Method method : serviceInterface.getDeclaredMethods()) {
                switch (method.getName()) {
                    case "approveTrust"   -> hasApproveTrust = true;
                    case "sendBackTrust"  -> hasSendBackTrust = true;
                    case "rejectTrust"    -> hasRejectTrust = true;
                    case "submitTrust"    -> hasSubmitTrust = true;
                }
            }

            assertThat(hasApproveTrust).as("approveTrust must still exist").isTrue();
            assertThat(hasSendBackTrust).as("sendBackTrust must still exist").isTrue();
            assertThat(hasRejectTrust).as("rejectTrust must still exist").isTrue();
            assertThat(hasSubmitTrust).as("submitTrust must still exist").isTrue();
        }

        @Test
        @DisplayName("GovernanceWorkflowService still has all Declaration workflow methods")
        void governance_service_still_has_declaration_workflow_methods() {
            Class<?> serviceInterface =
                    com.templeregistry.service.governance.GovernanceWorkflowService.class;

            boolean hasApproveDeclaration = false;
            boolean hasSendBackDeclaration = false;
            boolean hasRejectDeclaration = false;
            boolean hasSubmitDeclaration = false;
            boolean hasOrderPhysicalVerification = false;

            for (java.lang.reflect.Method method : serviceInterface.getDeclaredMethods()) {
                switch (method.getName()) {
                    case "approveDeclaration"         -> hasApproveDeclaration = true;
                    case "sendBackDeclaration"        -> hasSendBackDeclaration = true;
                    case "rejectDeclaration"          -> hasRejectDeclaration = true;
                    case "submitDeclaration"          -> hasSubmitDeclaration = true;
                    case "orderPhysicalVerification"  -> hasOrderPhysicalVerification = true;
                }
            }

            assertThat(hasApproveDeclaration).as("approveDeclaration must still exist").isTrue();
            assertThat(hasSendBackDeclaration).as("sendBackDeclaration must still exist").isTrue();
            assertThat(hasRejectDeclaration).as("rejectDeclaration must still exist").isTrue();
            assertThat(hasSubmitDeclaration).as("submitDeclaration must still exist").isTrue();
            assertThat(hasOrderPhysicalVerification).as("orderPhysicalVerification must still exist").isTrue();
        }
    }
}
