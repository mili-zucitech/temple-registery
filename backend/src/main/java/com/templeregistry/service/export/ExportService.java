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

    /**
     * Generate a ZIP evidence pack for a single temple.
     * Bundles: temple profile, trust, board members, employees, contractors,
     * declarations, documents list, workflow history, governance history, audit events.
     * Accessible to CAN_READ_ALL (AUDITOR + SUPER_ADMIN).
     * @return raw bytes of the ZIP file
     */
    byte[] generateEvidencePack(Long templeId, Long actorId);
}
