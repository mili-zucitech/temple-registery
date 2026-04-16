package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.ExportJobRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportJobRecordRepository extends JpaRepository<ExportJobRecord, String> {
}

