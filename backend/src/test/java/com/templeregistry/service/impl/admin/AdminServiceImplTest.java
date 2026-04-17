package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TempleSearchSummaryService searchSummaryService;
    @Mock private AuditService auditService;
    @Mock private PaginationUtil paginationUtil;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void createUser_ShouldLogAudit() {
        CreateUserRequest rq = CreateUserRequest.builder()
                .username("testuser").email("test@example.com").password("pass123")
                .fullName("Test User").role(UserRole.DC_STAFF).build();

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(1L);
            return u;
        });

        adminService.createUser(rq);

        verify(userRepository).save(any(User.class));
        verify(auditService).logDataEvent(anyLong(), eq("SUPER_ADMIN"), eq("CREATE_USER"),
                eq("User"), eq(1L), contains("testuser"));
    }

    @Test
    void rebuildSearchSummary_ShouldLogAudit() {
        adminService.rebuildSearchSummary();
        verify(searchSummaryService).rebuildAll();
        verify(auditService).logDataEvent(anyLong(), eq("SUPER_ADMIN"), eq("REBUILD_SEARCH_SUMMARY"),
                eq("System"), eq(0L), anyString());
    }
}
