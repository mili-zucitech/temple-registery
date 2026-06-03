package com.templeregistry.entity.auth;

/**
 * Controls the level of access a TEMPLE_AUTHORITY user has over their temple's data.
 *
 * <ul>
 *   <li>{@code VIEW}  – read-only; cannot create/update drafts, submit for review, or upload documents.</li>
 *   <li>{@code EDIT}  – full write access; can draft, submit, and upload (default for all TA users).</li>
 * </ul>
 *
 * All other roles ignore this field. Enforcement is performed by {@code AccessGuard}.
 */
public enum UserAccessType {
    VIEW,
    EDIT
}
