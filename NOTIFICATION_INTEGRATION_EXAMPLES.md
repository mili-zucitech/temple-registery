# Notification Integration - Real Code Examples

This document provides complete, copy-paste ready code examples for integrating notifications into your services.

## Example 1: Temple Service Integration

```java
package com.templeregistry.service.impl.temple;

import com.templeregistry.dto.request.CreateTempleRequest;
import com.templeregistry.dto.request.UpdateTempleRequest;
import com.templeregistry.dto.response.TempleDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.temple.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.temple.TempleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TempleServiceImpl implements TempleService {
    
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    
    @Override
    @Transactional
    public TempleDTO createTemple(CreateTempleRequest request, Long userId) {
        // Create temple entity
        Temple temple = Temple.builder()
                .name(request.getName())
                .districtId(request.getDistrictId())
                // ... other fields
                .build();
        
        Temple saved = templeRepository.save(temple);
        
        // Get DC for this district
        User dc = userRepository.findDistrictCollectorByDistrictId(saved.getDistrictId())
                .orElse(null);
        
        // Publish notification event
        if (dc != null) {
            notificationPublisher.publish(new TempleProfileCreatedEvent(
                this,
                saved.getId(),
                saved.getName(),
                userId,
                dc.getId()
            ));
            log.info("Published TempleProfileCreatedEvent for temple: {}", saved.getId());
        } else {
            log.warn("No DC found for district: {}", saved.getDistrictId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public TempleDTO updateTemple(Long templeId, UpdateTempleRequest request, Long userId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        // Update temple fields
        temple.setName(request.getName());
        // ... other fields
        
        Temple saved = templeRepository.save(temple);
        
        // Get DC for this district
        User dc = userRepository.findDistrictCollectorByDistrictId(saved.getDistrictId())
                .orElse(null);
        
        // Publish notification event
        if (dc != null) {
            notificationPublisher.publish(new TempleProfileUpdatedEvent(
                this,
                saved.getId(),
                saved.getName(),
                userId,
                dc.getId()
            ));
            log.info("Published TempleProfileUpdatedEvent for temple: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
}
```

## Example 2: DC Temple Service Integration

```java
package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.ApproveTempleRequest;
import com.templeregistry.dto.request.RejectTempleRequest;
import com.templeregistry.dto.request.FlagTempleRequest;
import com.templeregistry.dto.response.TempleDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.temple.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.dc.DCTempleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DCTempleServiceImpl implements DCTempleService {
    
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    
    @Override
    @Transactional
    public TempleDTO approveTemple(Long templeId, ApproveTempleRequest request, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        // Approve temple
        temple.setStatus("APPROVED");
        temple.setIsVerifiedByDc(true);
        temple.setVerifiedByDcAt(LocalDateTime.now());
        temple.setVerifiedByDcUserId(dcUserId);
        
        Temple saved = templeRepository.save(temple);
        
        // Get DC name
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish approval notification to TA
        notificationPublisher.publish(new TempleProfileApprovedEvent(
            this,
            saved.getId(),
            saved.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy()
        ));
        log.info("Published TempleProfileApprovedEvent for temple: {}", saved.getId());
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public TempleDTO rejectTemple(Long templeId, RejectTempleRequest request, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        // Reject temple
        temple.setStatus("REJECTED");
        temple.setDcRejectionReason(request.getReason());
        
        Temple saved = templeRepository.save(temple);
        
        // Get DC name
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish rejection notification to TA
        notificationPublisher.publish(new TempleProfileRejectedEvent(
            this,
            saved.getId(),
            saved.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            request.getReason()
        ));
        log.info("Published TempleProfileRejectedEvent for temple: {}", saved.getId());
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public TempleDTO flagForClarification(Long templeId, FlagTempleRequest request, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        // Flag temple
        temple.setIsFlaggedByDc(true);
        temple.setFlaggedByDcAt(LocalDateTime.now());
        temple.setFlaggedByDcUserId(dcUserId);
        
        Temple saved = templeRepository.save(temple);
        
        // Get DC name
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish flag notification to TA
        notificationPublisher.publish(new TempleProfileFlaggedEvent(
            this,
            saved.getId(),
            saved.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            request.getMessage()
        ));
        log.info("Published TempleProfileFlaggedEvent for temple: {}", saved.getId());
        
        return mapToDTO(saved);
    }
}
```

## Example 3: Declaration Service Integration

```java
package com.templeregistry.service.impl.declaration;

import com.templeregistry.dto.request.SubmitDeclarationRequest;
import com.templeregistry.dto.response.DeclarationDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.declaration.Declaration;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.declaration.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.declaration.DeclarationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationServiceImpl implements DeclarationService {
    
    private final DeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    
    @Override
    @Transactional
    public DeclarationDTO submitDeclaration(Long declarationId, Long userId) {
        Declaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
        
        // Submit declaration
        declaration.setStatus("SUBMITTED");
        declaration.setSubmittedAt(LocalDateTime.now());
        
        Declaration saved = declarationRepository.save(declaration);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DeclarationSubmittedEvent(
                this,
                saved.getId(),
                temple.getName(),
                userId,
                dc.getId(),
                saved.getFinancialYear()
            ));
            log.info("Published DeclarationSubmittedEvent for declaration: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public DeclarationDTO updateDeclaration(Long declarationId, UpdateDeclarationRequest request, Long userId) {
        Declaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
        
        // Update declaration
        // ... update fields
        
        Declaration saved = declarationRepository.save(declaration);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DeclarationUpdatedEvent(
                this,
                saved.getId(),
                temple.getName(),
                userId,
                dc.getId(),
                saved.getFinancialYear()
            ));
            log.info("Published DeclarationUpdatedEvent for declaration: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
}
```

## Example 4: DC Declaration Service Integration

```java
package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.ApproveDeclarationRequest;
import com.templeregistry.dto.request.RejectDeclarationRequest;
import com.templeregistry.dto.request.MarkForPhysicalVisitRequest;
import com.templeregistry.dto.response.DeclarationDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.declaration.Declaration;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.declaration.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.dc.DCDeclarationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DCDeclarationServiceImpl implements DCDeclarationService {
    
    private final DeclarationRepository declarationRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    
    @Override
    @Transactional
    public DeclarationDTO approveDeclaration(Long declarationId, ApproveDeclarationRequest request, Long dcUserId) {
        Declaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
        
        // Approve declaration
        declaration.setStatus("APPROVED");
        declaration.setApprovedAt(LocalDateTime.now());
        declaration.setApprovedBy(dcUserId);
        
        Declaration saved = declarationRepository.save(declaration);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish approval notification to TA
        notificationPublisher.publish(new DeclarationApprovedEvent(
            this,
            saved.getId(),
            temple.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            saved.getFinancialYear()
        ));
        log.info("Published DeclarationApprovedEvent for declaration: {}", saved.getId());
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public DeclarationDTO rejectDeclaration(Long declarationId, RejectDeclarationRequest request, Long dcUserId) {
        Declaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
        
        // Reject declaration
        declaration.setStatus("REJECTED");
        declaration.setRejectionReason(request.getReason());
        
        Declaration saved = declarationRepository.save(declaration);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish rejection notification to TA
        notificationPublisher.publish(new DeclarationRejectedEvent(
            this,
            saved.getId(),
            temple.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            request.getReason(),
            saved.getFinancialYear()
        ));
        log.info("Published DeclarationRejectedEvent for declaration: {}", saved.getId());
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public DeclarationDTO markForPhysicalVisit(Long declarationId, MarkForPhysicalVisitRequest request, Long dcUserId) {
        Declaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
        
        // Mark for physical visit
        declaration.setMarkedForPhysicalVisit(true);
        declaration.setPhysicalVisitScheduledDate(request.getScheduledDate());
        
        Declaration saved = declarationRepository.save(declaration);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findById(dcUserId)
                .orElseThrow(() -> new EntityNotFoundException("DC not found"));
        
        // Publish site visit notification to TA
        notificationPublisher.publish(new DeclarationMarkedForPhysicalVisitEvent(
            this,
            saved.getId(),
            temple.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            request.getScheduledDate(),
            saved.getFinancialYear()
        ));
        log.info("Published DeclarationMarkedForPhysicalVisitEvent for declaration: {}", saved.getId());
        
        return mapToDTO(saved);
    }
}
```

## Example 5: Employee Service Integration

```java
package com.templeregistry.service.impl.employee;

import com.templeregistry.dto.request.CreateEmployeeRequest;
import com.templeregistry.dto.request.UpdateEmployeeRequest;
import com.templeregistry.dto.response.EmployeeDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.employee.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.employee.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    
    @Override
    @Transactional
    public EmployeeDTO createEmployee(CreateEmployeeRequest request, Long userId) {
        Employee employee = Employee.builder()
                .templeId(request.getTempleId())
                .fullName(request.getFullName())
                .designation(request.getDesignation())
                // ... other fields
                .build();
        
        Employee saved = employeeRepository.save(employee);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new EmployeeCreatedEvent(
                this,
                saved.getId(),
                temple.getName(),
                saved.getFullName(),
                saved.getDesignation(),
                userId,
                dc.getId()
            ));
            log.info("Published EmployeeCreatedEvent for employee: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public EmployeeDTO updateEmployee(Long employeeId, UpdateEmployeeRequest request, Long userId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        
        // Update employee
        employee.setFullName(request.getFullName());
        employee.setDesignation(request.getDesignation());
        // ... other fields
        
        Employee saved = employeeRepository.save(employee);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new EmployeeUpdatedEvent(
                this,
                saved.getId(),
                temple.getName(),
                saved.getFullName(),
                saved.getDesignation(),
                userId,
                dc.getId()
            ));
            log.info("Published EmployeeUpdatedEvent for employee: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteEmployee(Long employeeId, Long userId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        
        // Get temple and DC before deletion
        Temple temple = templeRepository.findById(employee.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        String employeeName = employee.getFullName();
        String designation = employee.getDesignation();
        Long employeeId = employee.getId();
        
        // Delete employee
        employeeRepository.delete(employee);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new EmployeeDeletedEvent(
                this,
                employeeId,
                temple.getName(),
                employeeName,
                designation,
                userId,
                dc.getId()
            ));
            log.info("Published EmployeeDeletedEvent for employee: {}", employeeId);
        }
    }
}
```

## Example 6: Document Service Integration

```java
package com.templeregistry.service.impl.document;

import com.templeregistry.dto.request.UploadDocumentRequest;
import com.templeregistry.dto.response.DocumentDTO;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.document.Document;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.event.document.*;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.document.DocumentRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.document.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {
    
    private final DocumentRepository documentRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    private final NotificationEventPublisher notificationPublisher;
    private final S3Service s3Service;
    
    @Override
    @Transactional
    public DocumentDTO uploadDocument(MultipartFile file, UploadDocumentRequest request, Long userId) {
        // Upload file to S3
        String s3Key = s3Service.uploadFile(file);
        
        Document document = Document.builder()
                .templeId(request.getTempleId())
                .documentType(request.getDocumentType())
                .fileName(file.getOriginalFilename())
                .s3Key(s3Key)
                .build();
        
        Document saved = documentRepository.save(document);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(request.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DocumentUploadedEvent(
                this,
                saved.getId(),
                temple.getName(),
                saved.getDocumentType(),
                saved.getFileName(),
                userId,
                dc.getId()
            ));
            log.info("Published DocumentUploadedEvent for document: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public DocumentDTO updateDocument(Long documentId, MultipartFile file, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // Delete old file from S3
        s3Service.deleteFile(document.getS3Key());
        
        // Upload new file
        String s3Key = s3Service.uploadFile(file);
        
        document.setFileName(file.getOriginalFilename());
        document.setS3Key(s3Key);
        
        Document saved = documentRepository.save(document);
        
        // Get temple and DC
        Temple temple = templeRepository.findById(saved.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DocumentUpdatedEvent(
                this,
                saved.getId(),
                temple.getName(),
                saved.getDocumentType(),
                saved.getFileName(),
                userId,
                dc.getId()
            ));
            log.info("Published DocumentUpdatedEvent for document: {}", saved.getId());
        }
        
        return mapToDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // Get temple and DC before deletion
        Temple temple = templeRepository.findById(document.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        String documentType = document.getDocumentType();
        String fileName = document.getFileName();
        Long docId = document.getId();
        
        // Delete file from S3
        s3Service.deleteFile(document.getS3Key());
        
        // Delete document
        documentRepository.delete(document);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DocumentDeletedEvent(
                this,
                docId,
                temple.getName(),
                documentType,
                fileName,
                userId,
                dc.getId()
            ));
            log.info("Published DocumentDeletedEvent for document: {}", docId);
        }
    }
}
```

## Common Helper Method

Add this helper method to your base service or utility class:

```java
/**
 * Gets the District Collector for a given district ID.
 * Returns null if no DC is found (logs warning).
 */
protected User getDistrictCollectorForDistrict(Long districtId) {
    return userRepository.findDistrictCollectorByDistrictId(districtId)
            .orElseGet(() -> {
                log.warn("No District Collector found for district: {}", districtId);
                return null;
            });
}
```

## Testing Your Integration

```java
@SpringBootTest
@Transactional
class NotificationIntegrationTest {
    
    @Autowired
    private TempleService templeService;
    
    @Autowired
    private InAppNotificationRepository notificationRepository;
    
    @Test
    void testTempleCreationNotification() {
        // Create temple
        CreateTempleRequest request = new CreateTempleRequest();
        request.setName("Test Temple");
        request.setDistrictId(1L);
        
        TempleDTO temple = templeService.createTemple(request, taUserId);
        
        // Wait for async processing
        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            // Verify notification was created
            List<InAppNotification> notifications = 
                notificationRepository.findByUserId(dcUserId);
            
            assertThat(notifications).hasSize(1);
            assertThat(notifications.get(0).getTitle()).contains("New Temple Profile");
            assertThat(notifications.get(0).getPriority()).isEqualTo("MEDIUM");
        });
    }
}
```

---

**That's it!** Copy these examples and adapt them to your specific service implementations.
