package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private TempleRepository templeRepository;
    @Mock private DistrictRepository districtRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TempleSearchSummaryService searchSummaryService;
    @Mock private AuditService auditService;
    @Mock private PaginationUtil paginationUtil;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        var claims = new ScopeHelper.Claims(99L, "SUPER_ADMIN", null, null, "admin");
        var auth = new UsernamePasswordAuthenticationToken(claims, null, java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
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
    void should_autoCreateTemple_when_roleIsTempleAuthority() {
        CreateUserRequest rq = CreateUserRequest.builder()
                .username("ta_user").email("ta@example.com").password("pass1234")
                .fullName("Temple Admin").role(UserRole.TEMPLE_AUTHORITY)
                .districtId(1L).templeName("Test Temple").aadhaarNumber("123456789012")
                .build();

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(templeRepository.save(any())).thenAnswer(i -> {
            var t = (com.templeregistry.entity.temple.Temple) i.getArgument(0);
            t.setId(10L);
            return t;
        });
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(2L);
            return u;
        });

        var result = adminService.createUser(rq);

        verify(templeRepository).save(any());
        verify(userRepository).save(argThat(u -> u.getTempleId() != null && u.getTempleId() == 10L));
        verify(searchSummaryService).scheduleRefresh(10L);
    }

    @Test
    void rebuildSearchSummary_ShouldLogAudit() {
        adminService.rebuildSearchSummary();
        verify(searchSummaryService).rebuildAll();
        verify(auditService).logDataEvent(anyLong(), eq("SUPER_ADMIN"), eq("REBUILD_SEARCH_SUMMARY"),
                eq("System"), eq(0L), anyString());
    }
}
