package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Filter object for the DC dashboard unified workflow query.
 * All fields are optional — null means "no filter on this dimension".
 */
@Getter
@Builder
public class WorkflowQueryFilter {

    /** DC's district — mandatory for DC dashboard queries. */
    private final Long districtId;

    /** TA's temple — mandatory for TA dashboard queries. */
    private final Long templeId;

    /** Filter by specific entity types. Null = all types. */
    private final List<WorkflowEntityType> entityTypes;

    /** Filter by specific statuses. Null = all statuses. */
    private final List<WorkflowStatus> statuses;

    /** Free-text search on entity summary (temple name, trust name, etc.). */
    private final String searchTerm;

    /** Only show overdue items. */
    private final boolean overdueOnly;
}
