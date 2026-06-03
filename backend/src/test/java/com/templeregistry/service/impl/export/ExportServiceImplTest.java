package com.templeregistry.service.impl.export;

import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceImplTest {

    @Mock TempleRepository templeRepository;
    @Mock DeclarationRepository declarationRepository;
    @Mock AuditService auditService;
    @Mock JurisdictionGuard jurisdictionGuard;

    @InjectMocks ExportServiceImpl exportService;

    private ScopeHelper.Claims dcClaims;

    @BeforeEach
    void setUp() {
        dcClaims = new ScopeHelper.Claims(5L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc_user", "EDIT");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(dcClaims, "n/a", List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_exportTemples_scopedByDistrict_when_districtIdEnforced() {
        when(jurisdictionGuard.enforceDistrictId(999L)).thenReturn(10L);
        when(templeRepository.findAllByDistrictId(eq(10L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(Temple.builder().name("T1").districtId(10L).build())));

        ExportTemplesRequest rq = new ExportTemplesRequest();
        rq.setDistrictId(999L); // ignored by guard
        rq.setFormat("CSV");

        byte[] csv = exportService.exportTemples(rq);

        assertThat(csv).isNotNull();
        verify(templeRepository).findAllByDistrictId(eq(10L), any(PageRequest.class));
        verify(templeRepository, never()).findAll(any(PageRequest.class));
        verify(auditService).logExportEvent(eq(5L), eq(RoleConstants.DISTRICT_COLLECTOR), anyString(), anyString(), eq(1));
    }

    @Test
    void should_exportDeclarations_scopedByDistrict_when_noStatusProvided() {
        when(jurisdictionGuard.enforceDistrictId(null)).thenReturn(10L);
        when(declarationRepository.findAllByDistrictId(eq(10L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(buildDeclaration(1L, 10L, DeclarationStatus.SUBMITTED))));

        ExportDeclarationsRequest rq = new ExportDeclarationsRequest();
        rq.setDistrictId(null);
        rq.setFormat("CSV");
        rq.setStatus(null);

        byte[] csv = exportService.exportDeclarations(rq);

        assertThat(csv).isNotNull();
        verify(declarationRepository).findAllByDistrictId(eq(10L), any(PageRequest.class));
        verify(declarationRepository, never()).findAll(any(PageRequest.class));
    }

    @Test
    void should_exportDeclarations_byStatus_withoutDistrict_when_districtIdIsNull() {
        when(jurisdictionGuard.enforceDistrictId(null)).thenReturn(null);
        when(declarationRepository.findAllByStatus(eq(DeclarationStatus.APPROVED), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(buildDeclaration(2L, 99L, DeclarationStatus.APPROVED))));

        ExportDeclarationsRequest rq = new ExportDeclarationsRequest();
        rq.setDistrictId(null);
        rq.setFormat("CSV");
        rq.setStatus("APPROVED");

        byte[] csv = exportService.exportDeclarations(rq);

        assertThat(csv).isNotNull();
        verify(declarationRepository).findAllByStatus(eq(DeclarationStatus.APPROVED), any(PageRequest.class));
        verify(declarationRepository, never()).findAllByDistrictIdAndStatus(any(), any(), any(PageRequest.class));
    }

    private static AssetDeclaration buildDeclaration(Long id, Long districtId, DeclarationStatus status) {
        AssetDeclaration d = AssetDeclaration.builder()
                .districtId(districtId)
                .status(status)
                .build();
        d.setId(id);
        return d;
    }
}

