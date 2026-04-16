package com.templeregistry.service.impl.document;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.document.Document;
import com.templeregistry.exception.ImmutableResourceException;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.document.DocumentAccessLogRepository;
import com.templeregistry.repository.document.DocumentRepository;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

    @Mock DocumentRepository documentRepository;
    @Mock DocumentAccessLogRepository accessLogRepository;
    @Mock FileStorageService fileStorageService;
    @Mock PaginationUtil paginationUtil;
    @Mock DeclarationRepository declarationRepository;

    @InjectMocks DocumentServiceImpl documentService;

    @Test
    void should_blockSoftDelete_when_documentAttachedToApprovedDeclaration() {
        Document doc = Document.builder()
                .ownerType("DECLARATION")
                .ownerId(1L)
                .referenceId(99L)
                .originalFilename("a.pdf")
                .s3Key("k")
                .mimeType("application/pdf")
                .fileSizeBytes(10L)
                .build();
        doc.setId(7L);

        AssetDeclaration approved = AssetDeclaration.builder()
                .status(DeclarationStatus.APPROVED)
                .build();
        approved.setId(99L);

        when(documentRepository.findById(7L)).thenReturn(Optional.of(doc));
        when(declarationRepository.findById(99L)).thenReturn(Optional.of(approved));

        assertThatThrownBy(() -> documentService.softDelete(7L))
                .isInstanceOf(ImmutableResourceException.class);

        verify(documentRepository, never()).deleteById(anyLong());
    }
}

