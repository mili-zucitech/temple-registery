package com.templeregistry.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validates that the security expression constants remain consistent with
 * their intended access semantics. Any unintentional change to these constants
 * will be caught here before deployment.
 */
class RoleConstantsTest {

    @Test
    void should_confirm_CAN_RAISE_OBSERVATION_includes_both_auditor_and_super_admin() {
        assertThat(RoleConstants.CAN_RAISE_OBSERVATION)
                .contains("AUDITOR")
                .contains("SUPER_ADMIN");
    }

    @Test
    void should_confirm_CAN_READ_ALL_includes_super_admin() {
        assertThat(RoleConstants.CAN_READ_ALL).contains("SUPER_ADMIN");
    }

    @Test
    void should_confirm_CAN_READ_ALL_includes_auditor() {
        assertThat(RoleConstants.CAN_READ_ALL).contains("AUDITOR");
    }

    @Test
    void should_confirm_CAN_READ_ALL_includes_district_collector() {
        assertThat(RoleConstants.CAN_READ_ALL).contains("DISTRICT_COLLECTOR");
    }

    @Test
    void should_confirm_ADMIN_ONLY_restricts_to_super_admin() {
        assertThat(RoleConstants.ADMIN_ONLY)
                .contains("SUPER_ADMIN")
                .doesNotContain("AUDITOR")
                .doesNotContain("DISTRICT_COLLECTOR")
                .doesNotContain("TEMPLE_AUTHORITY");
    }

    @Test
    void should_confirm_AUDITOR_ONLY_restricts_to_auditor() {
        assertThat(RoleConstants.AUDITOR_ONLY)
                .contains("AUDITOR")
                .doesNotContain("SUPER_ADMIN")
                .doesNotContain("DISTRICT_COLLECTOR");
    }

    @Test
    void should_confirm_CAN_APPROVE_does_not_include_auditor() {
        assertThat(RoleConstants.CAN_APPROVE).doesNotContain("AUDITOR");
    }

    @Test
    void should_confirm_CAN_SUBMIT_includes_temple_authority() {
        // Super Admin is also allowed to submit on behalf of temple
        assertThat(RoleConstants.CAN_SUBMIT)
                .contains("TEMPLE_AUTHORITY")
                .contains("SUPER_ADMIN");
    }
}
