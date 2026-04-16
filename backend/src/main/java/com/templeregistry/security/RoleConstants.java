package com.templeregistry.security;

/**
 * Role string constants used in @PreAuthorize expressions across all service
 * implementations.
 * Roles match exactly what is stored in the JWT 'role' claim and in the users
 * table.
 */
public final class RoleConstants {

        private RoleConstants() {
        }

        public static final String SUPER_ADMIN = "SUPER_ADMIN";
        public static final String DISTRICT_COLLECTOR = "DISTRICT_COLLECTOR";
        public static final String DC_STAFF = "DC_STAFF";
        public static final String TEMPLE_AUTHORITY = "TEMPLE_AUTHORITY";
        public static final String AUDITOR = "AUDITOR";

        // Spring Security role prefix forms (used in hasRole() expressions)
        public static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
        public static final String ROLE_DISTRICT_COLLECTOR = "ROLE_DISTRICT_COLLECTOR";
        public static final String ROLE_DC_STAFF = "ROLE_DC_STAFF";
        public static final String ROLE_TEMPLE_AUTHORITY = "ROLE_TEMPLE_AUTHORITY";
        public static final String ROLE_AUDITOR = "ROLE_AUDITOR";

        // Convenience SpEL expressions for @PreAuthorize
        public static final String CAN_APPROVE = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR')";

        /**
         * Write operations that involve governance actions (verifying, flagging,
         * approving).
         * Strictly for DISTRICT_COLLECTOR and SUPER_ADMIN.
         */
        public static final String CAN_ACT_DC = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR')";

        /**
         * Write operations that DC_STAFF can perform (e.g. marking notifications as
         * read).
         * Excludes AUDITOR which is strictly read-only.
         */
        public static final String CAN_WRITE_DC = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR', 'DC_STAFF')";

        /** Route-level guard for all DC-module endpoints (controllers). */
        public static final String IS_DC_ROLE = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR', 'DC_STAFF')";
        public static final String CAN_SUBMIT = "hasAnyRole('SUPER_ADMIN', 'TEMPLE_AUTHORITY')";
        public static final String CAN_READ_ALL = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR', 'DC_STAFF', 'AUDITOR')";
        public static final String ADMIN_ONLY = "hasRole('SUPER_ADMIN')";
}
