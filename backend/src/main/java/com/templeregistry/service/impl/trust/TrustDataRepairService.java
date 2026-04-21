package com.templeregistry.service.impl.trust;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.service.trust.TrustValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrustDataRepairService {

    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TempleRepository templeRepository;
    private final TrustValidationService trustValidationService;

    @EventListener(ApplicationReadyEvent.class)
    @Async("taskExecutor")
    @Transactional
    public void repairLiveTrustData() {
        repairTrustDatesAndTempleFlags();
        repairEncryptedBoardMembers();
    }

    private void repairTrustDatesAndTempleFlags() {
        List<Trust> trusts = trustRepository.findAll();
        int fixedDates = 0;
        for (Trust trust : trusts) {
            if (trust.getDateOfRegistration() != null && trust.getDateOfRegistration().isAfter(LocalDate.now())) {
                trust.setDateOfRegistration(LocalDate.now());
                fixedDates++;
            }
        }

        int syncedTemples = 0;
        for (Temple temple : templeRepository.findAll()) {
            boolean shouldBeRegistered = trustRepository.existsByTempleIdAndIsDeletedFalse(temple.getId());
            if (temple.isTrustRegistered() != shouldBeRegistered) {
                temple.setTrustRegistered(shouldBeRegistered);
                syncedTemples++;
            }
        }

        if (fixedDates > 0 || syncedTemples > 0) {
            log.warn("Trust data repair applied: fixedDates={}, syncedTempleFlags={}", fixedDates, syncedTemples);
        }
    }

    private void repairEncryptedBoardMembers() {
        int touched = 0;
        for (BoardMember member : boardMemberRepository.findAll()) {
            boolean derivedCurrent = trustValidationService.isCurrentMember(member.getTenureEndDate());
            if (member.isCurrent() != derivedCurrent) {
                member.setCurrent(derivedCurrent);
                touched++;
            }
        }
        if (touched > 0) {
            log.warn("Board member current-state repair applied to {} records.", touched);
        }
    }
}
