# Notification Event System - Integration Example

## How to Integrate Notification Events into Existing Services

This document shows **exactly** how to add notification events to your existing service methods.

---

## Example 1: GovernanceWorkflowServiceImpl

### **Before Integration (Current Code)**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class GovernanceWorkflowServiceImpl implements GovernanceWorkflowService {

    private final AssetDeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    // ... other dependencies

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse approveDeclaration(
            Long declarationId, 
            WorkflowApproveRequest request,
            ScopeHelper.Claims claims) {
        
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = templeRepository.findWithGeoById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Validate transition
        stateTransitionValidator.validate(declaration.getStatus(), DeclarationStatus.APPROVED);
        
        // Update status
        declaration.setStatus(DeclarationStatus.APPROVED);
        declaration.setApprovedAt(LocalDateTime.now());
        declaration.setAcknowledgementNumber(generateAcknowledgementNumber(temple, declaration));
        
        declarationRepository.save(declaration);
        
        // Log governance action
        governanceActionService.logAction(
                "DECLARATION", declarationId, "APPROVED",
                claims.userId(), claims.role().name(), request.getRemarks()
        );
        
        return WorkflowActionResponse.builder()
                .newStatus("APPROVED")
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .build();
    }
}
```

### **After Integration (With Notification Events)**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class GovernanceWorkflowServiceImpl implements GovernanceWorkflowService {

    private final AssetDeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    private final NotificationEventPublisher eventPublisher;  // ← ADD THIS
    // ... other dependencies

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse approveDeclaration(
            Long declarationId, 
            WorkflowApproveRequest request,
            ScopeHelper.Claims claims) {
        
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = templeRepository.findWithGeoById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Validate transition
        stateTransitionValidator.validate(declaration.getStatus(), DeclarationStatus.APPROVED);
        
        // Update status
        declaration.setStatus(DeclarationStatus.APPROVED);
        declaration.setApprovedAt(LocalDateTime.now());
        declaration.setAcknowledgementNumber(generateAcknowledgementNumber(temple, declaration));
        
        declarationRepository.save(declaration);
        
        // Log governance action
        governanceActionService.logAction(
                "DECLARATION", declarationId, "APPROVED",
                claims.userId(), claims.role().name(), request.getRemarks()
        );
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        eventPublisher.publish(new DeclarationApprovedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                claims.userId(),
                temple.getCreatedBy(),  // Temple Authority user ID
                declaration.getAcknowledgementNumber(),
                declaration.getFinancialYear()
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
        
        return WorkflowActionResponse.builder()
                .newStatus("APPROVED")
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse rejectDeclaration(
            Long declarationId, 
            WorkflowRejectRequest request,
            ScopeHelper.Claims claims) {
        
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = templeRepository.findWithGeoById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Validate transition
        stateTransitionValidator.validate(declaration.getStatus(), DeclarationStatus.REJECTED);
        
        // Update status
        declaration.setStatus(DeclarationStatus.REJECTED);
        declaration.setRejectedAt(LocalDateTime.now());
        
        declarationRepository.save(declaration);
        
        // Log governance action
        governanceActionService.logAction(
                "DECLARATION", declarationId, "REJECTED",
                claims.userId(), claims.role().name(), request.getReason()
        );
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        eventPublisher.publish(new DeclarationRejectedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                claims.userId(),
                temple.getCreatedBy(),  // Temple Authority user ID
                request.getReason(),
                declaration.getFinancialYear()
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
        
        return WorkflowActionResponse.builder()
                .newStatus("REJECTED")
                .build();
    }
}
```

---

## Example 2: DeclarationServiceImpl

### **Adding Event to Submit Method**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationServiceImpl implements DeclarationService {

    private final AssetDeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher eventPublisher;  // ← ADD THIS
    // ... other dependencies

    @Override
    @Transactional
    @PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
    public void submit(Long declarationId, ScopeHelper.Claims claims) {
        AssetDeclaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration", declarationId));
        
        Temple temple = templeRepository.findById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Validate
        if (declaration.getStatus() != DeclarationStatus.DRAFT) {
            throw new IllegalStatusTransitionException("Only DRAFT declarations can be submitted");
        }
        
        // Update status
        declaration.setStatus(DeclarationStatus.SUBMITTED);
        declaration.setSubmittedAt(LocalDateTime.now());
        declarationRepository.save(declaration);
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        Long dcUserId = findDcUserIdForDistrict(temple.getDistrictId());
        eventPublisher.publish(new DeclarationSubmittedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                claims.userId(),
                dcUserId,
                declaration.getFinancialYear()
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
    }
    
    /**
     * Helper method to find the DC user ID for a given district.
     */
    private Long findDcUserIdForDistrict(Long districtId) {
        return userRepository.findByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, districtId)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("No DC found for district: " + districtId));
    }
}
```

---

## Example 3: ClarificationService

### **Adding Events for Clarification Workflow**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ClarificationServiceImpl implements ClarificationService {

    private final DeclarationClarificationRepository clarificationRepository;
    private final AssetDeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    private final NotificationEventPublisher eventPublisher;  // ← ADD THIS

    @Override
    @Transactional
    @PreAuthorize("hasRole('DISTRICT_COLLECTOR')")
    public void requestClarification(
            Long declarationId, 
            ClarificationRequest request,
            ScopeHelper.Claims claims) {
        
        AssetDeclaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration", declarationId));
        
        Temple temple = templeRepository.findById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Create clarification record
        DeclarationClarification clarification = DeclarationClarification.builder()
                .declaration(declaration)
                .message(request.getMessage())
                .direction(ClarificationDirection.DC_TO_TA)
                .requestedAt(LocalDateTime.now())
                .build();
        clarificationRepository.save(clarification);
        
        // Update declaration status
        declaration.setStatus(DeclarationStatus.CLARIFICATION_REQUIRED);
        declarationRepository.save(declaration);
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        eventPublisher.publish(new ClarificationRequestedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                claims.userId(),
                temple.getCreatedBy(),  // Temple Authority user ID
                request.getMessage(),
                declaration.getFinancialYear()
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
    public void respondToClarification(
            Long clarificationId, 
            ClarificationResponse response,
            ScopeHelper.Claims claims) {
        
        DeclarationClarification clarification = clarificationRepository.findById(clarificationId)
                .orElseThrow(() -> new EntityNotFoundException("Clarification", clarificationId));
        
        AssetDeclaration declaration = clarification.getDeclaration();
        Temple temple = templeRepository.findById(declaration.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", declaration.getTempleId()));
        
        // Update clarification
        clarification.setResponse(response.getMessage());
        clarification.setRespondedAt(LocalDateTime.now());
        clarificationRepository.save(clarification);
        
        // Update declaration status
        declaration.setStatus(DeclarationStatus.CLARIFICATION_RESPONDED);
        declarationRepository.save(declaration);
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        Long dcUserId = findDcUserIdForDistrict(temple.getDistrictId());
        eventPublisher.publish(new ClarificationRespondedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                claims.userId(),
                dcUserId,
                declaration.getFinancialYear()
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
    }
}
```

---

## Example 4: EmployeeServiceImpl

### **Adding Events for Employee CRUD**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher eventPublisher;  // ← ADD THIS

    @Override
    @Transactional
    @PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
    public EmployeeResponse create(CreateEmployeeRequest request, ScopeHelper.Claims claims) {
        Temple temple = templeRepository.findById(request.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", request.getTempleId()));
        
        // Create employee
        Employee employee = Employee.builder()
                .temple(temple)
                .fullName(request.getFullName())
                .designation(request.getDesignation())
                .dateOfJoining(request.getDateOfJoining())
                .status(EmployeeStatus.ACTIVE)
                .build();
        
        employee = employeeRepository.save(employee);
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        Long dcUserId = findDcUserIdForDistrict(temple.getDistrictId());
        eventPublisher.publish(new EmployeeCreatedEvent(
                this,
                employee.getId(),
                temple.getName(),
                employee.getFullName(),
                claims.userId(),
                dcUserId
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
        
        return mapper.toResponse(employee);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
    public EmployeeResponse update(Long id, UpdateEmployeeRequest request, ScopeHelper.Claims claims) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee", id));
        
        Temple temple = employee.getTemple();
        
        // Update fields
        employee.setFullName(request.getFullName());
        employee.setDesignation(request.getDesignation());
        // ... other fields
        
        employee = employeeRepository.save(employee);
        
        // ↓↓↓ ADD THIS: Publish notification event ↓↓↓
        Long dcUserId = findDcUserIdForDistrict(temple.getDistrictId());
        eventPublisher.publish(new EmployeeUpdatedEvent(
                this,
                employee.getId(),
                temple.getName(),
                employee.getFullName(),
                claims.userId(),
                dcUserId
        ));
        // ↑↑↑ END OF ADDITION ↑↑↑
        
        return mapper.toResponse(employee);
    }
}
```

---

## Quick Integration Checklist

For each service method that should trigger notifications:

1. ✅ **Add dependency injection:**
   ```java
   private final NotificationEventPublisher eventPublisher;
   ```

2. ✅ **After state change, publish event:**
   ```java
   eventPublisher.publish(new SomeEvent(...));
   ```

3. ✅ **Gather required data:**
   - Entity ID
   - Entity name (temple name, employee name, etc.)
   - Actor user ID (from `claims.userId()`)
   - Recipient user ID (DC or TA)
   - Any context-specific data (financial year, reason, etc.)

4. ✅ **Choose the right event class:**
   - Declaration events: `event/declaration/`
   - Employee events: `event/employee/`
   - Contractor events: `event/contractor/`
   - Temple events: `event/temple/`
   - Trust events: `event/trust/`
   - Document events: `event/document/`

5. ✅ **Test the integration:**
   - Perform the action (submit, approve, reject, etc.)
   - Check `/api/v1/notifications` for the recipient user
   - Verify notification appears with correct title and body

---

## Common Patterns

### **Pattern 1: TA Action → Notify DC**

```java
Long dcUserId = findDcUserIdForDistrict(temple.getDistrictId());
eventPublisher.publish(new SomeSubmittedEvent(
        this, entityId, templeName, claims.userId(), dcUserId, ...
));
```

### **Pattern 2: DC Action → Notify TA**

```java
Long taUserId = temple.getCreatedBy();  // or fetch from temple.getUser()
eventPublisher.publish(new SomeApprovedEvent(
        this, entityId, templeName, claims.userId(), taUserId, ...
));
```

### **Pattern 3: System Action → Notify Both**

```java
eventPublisher.publish(new DeclarationOverdueEvent(
        this, declarationId, templeName, taUserId, dcUserId, dueDate, financialYear
));
```

---

## Testing Your Integration

### **Manual Test**

1. Start the application
2. Log in as Temple Authority
3. Submit a declaration
4. Log in as District Collector
5. Call `GET /api/v1/notifications`
6. Verify notification appears:
   ```json
   {
     "success": true,
     "data": {
       "content": [
         {
           "id": 1,
           "title": "New Declaration Submitted",
           "body": "Test Temple has submitted an asset declaration for FY 2024. Review required.",
           "referenceType": "DECLARATION",
           "referenceId": 123,
           "read": false,
           "createdAt": "2024-04-24T10:30:00"
         }
       ]
     }
   }
   ```

### **Integration Test**

```java
@SpringBootTest
@Transactional
class NotificationIntegrationTest {

    @Autowired
    private DeclarationService declarationService;
    
    @Autowired
    private InAppNotificationRepository notificationRepository;
    
    @Test
    void submitDeclaration_createsNotificationForDC() {
        // Given
        Long declarationId = createDraftDeclaration();
        Long dcUserId = 100L;
        
        // When
        declarationService.submit(declarationId, taClaims);
        
        // Wait for async processing
        await().atMost(5, TimeUnit.SECONDS).until(() -> 
            notificationRepository.countByUserIdAndIsRead(dcUserId, false) > 0
        );
        
        // Then
        List<InAppNotification> notifications = notificationRepository
                .findAllByUserIdOrderByCreatedAtDesc(dcUserId, PageRequest.of(0, 10))
                .getContent();
        
        assertThat(notifications).isNotEmpty();
        assertThat(notifications.get(0).getTitle()).contains("Declaration Submitted");
    }
}
```

---

## Summary

**Integration is simple:**
1. Inject `NotificationEventPublisher`
2. After state change, call `eventPublisher.publish(new SomeEvent(...))`
3. Event system handles the rest asynchronously

**No changes needed to:**
- Controllers
- DTOs
- Repositories
- Existing tests (notifications are fire-and-forget)

The event system is **decoupled** from your business logic and will not break existing functionality.
