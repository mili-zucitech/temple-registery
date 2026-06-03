package com.templeregistry.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * In-process Caffeine cache configuration for the DACVM policy engine.
 *
 * <p>Cache design decisions:</p>
 * <ul>
 *   <li>TTL of 5 minutes prevents stale policies from persisting after SA changes.</li>
 *   <li>Max 10,000 entries covers all plausible role×target combinations with headroom.</li>
 *   <li>On policy write, {@link com.templeregistry.service.accesscontrol.PolicyEvaluationService#invalidateCache}
 *       calls {@code @CacheEvict(allEntries=true)} so changes propagate immediately.</li>
 *   <li>This config is swap-compatible with Redis: replace {@link CaffeineCacheManager} with
 *       {@code RedisCacheManager} and the {@code @Cacheable} / {@code @CacheEvict} annotations
 *       on {@code PolicyEvaluationServiceImpl} work without modification.</li>
 * </ul>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** Name used in @Cacheable / @CacheEvict across PolicyEvaluationServiceImpl. */
    public static final String DACVM_CACHE = "dacvmPolicies";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(DACVM_CACHE);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(10_000)
                .recordStats());
        return manager;
    }
}
