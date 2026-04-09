package com.templeregistry.service.export;

import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;

public interface ExportService {

    /**
     * Generate jurisdiction-scoped temple export.
     * Inserts an {@link com.templeregistry.entity.audit.AuditExportEvent} before generating.
     * @return raw bytes of the generated file
     */
    byte[] exportTemples(ExportTemplesRequest request);

    /**
     * Generate jurisdiction-scoped declaration export.
     * Inserts an {@link com.templeregistry.entity.audit.AuditExportEvent} before generating.
     * @return raw bytes of the generated file
     */
    byte[] exportDeclarations(ExportDeclarationsRequest request);
}
