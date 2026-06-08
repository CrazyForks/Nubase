package ai.nubase.auth.service;

import ai.nubase.common.config.AuthConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter + failed-login lockout for auth endpoints. Keys are namespaced by
 * tenant + action + identity.
 *
 * <p>When a {@link StringRedisTemplate} bean is present (Redis configured), state is shared
 * across the fleet via Redis counters with TTLs — correct for horizontally-scaled deployments.
 * Otherwise it falls back to a per-JVM in-process implementation (fine for single-/few-node).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private final EffectiveAuthConfig effectiveAuthConfig;

    /** Optional — present only when Redis is configured. Null → in-process fallback. */
    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    private final Map<String, Deque<Long>> windows = new ConcurrentHashMap<>();
    private final Map<String, FailureState> failures = new ConcurrentHashMap<>();

    private record FailureState(int count, long lockedUntilMillis) {}

    private boolean useRedis() {
        return redisTemplate != null;
    }

    /**
     * Enforce a request cap for a sensitive action within the configured window.
     *
     * @throws RateLimitExceededException when the cap is exceeded
     */
    public void checkRate(String action, String identifier) {
        AuthConfig.RateLimitSettings cfg = effectiveAuthConfig.rateLimit();
        if (!cfg.isEnabled()) {
            return;
        }
        if (useRedis()) {
            checkRateRedis(cfg, action, identifier);
            return;
        }
        String key = key(action, identifier);
        long now = System.currentTimeMillis();
        long windowMs = cfg.getWindowSeconds() * 1000L;

        Deque<Long> hits = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (hits) {
            while (!hits.isEmpty() && now - hits.peekFirst() > windowMs) {
                hits.pollFirst();
            }
            if (hits.size() >= cfg.getMaxRequests()) {
                throw new RateLimitExceededException(
                        "Rate limit exceeded for " + action + ". Please try again later.");
            }
            hits.addLast(now);
        }
    }

    /**
     * Throw if the identity is currently locked out due to too many failed sign-ins.
     */
    public void assertNotLockedOut(String identifier) {
        AuthConfig.RateLimitSettings cfg = effectiveAuthConfig.rateLimit();
        if (!cfg.isEnabled()) {
            return;
        }
        if (useRedis()) {
            if (Boolean.TRUE.equals(redisTemplate.hasKey("rl:lock:" + tenant() + ":" + identifier))) {
                throw new RateLimitExceededException("Too many failed attempts. Account temporarily locked.");
            }
            return;
        }
        FailureState state = failures.get(lockKey(identifier));
        if (state != null && state.lockedUntilMillis() > System.currentTimeMillis()) {
            long secs = (state.lockedUntilMillis() - System.currentTimeMillis()) / 1000 + 1;
            throw new RateLimitExceededException(
                    "Too many failed attempts. Account temporarily locked for " + secs + "s.");
        }
    }

    /** Record a failed sign-in; lock the identity once the threshold is crossed. */
    public void recordFailure(String identifier) {
        AuthConfig.RateLimitSettings cfg = effectiveAuthConfig.rateLimit();
        if (!cfg.isEnabled()) {
            return;
        }
        if (useRedis()) {
            recordFailureRedis(cfg, identifier);
            return;
        }
        String key = lockKey(identifier);
        failures.compute(key, (k, prev) -> {
            int count = (prev == null ? 0 : prev.count()) + 1;
            long lockedUntil = 0;
            if (count >= cfg.getMaxFailedLogins()) {
                lockedUntil = System.currentTimeMillis() + cfg.getLockoutSeconds() * 1000L;
                log.warn("Identity '{}' locked out after {} failed attempts", identifier, count);
            }
            return new FailureState(count, lockedUntil);
        });
    }

    /** Clear failed-attempt state after a successful sign-in. */
    public void recordSuccess(String identifier) {
        if (useRedis()) {
            redisTemplate.delete("rl:fail:" + tenant() + ":" + identifier);
            redisTemplate.delete("rl:lock:" + tenant() + ":" + identifier);
            return;
        }
        failures.remove(lockKey(identifier));
    }

    // ---------------------------------------------------------------- Redis backend

    private void checkRateRedis(AuthConfig.RateLimitSettings cfg, String action, String identifier) {
        String key = "rl:" + key(action, identifier);
        Long n = redisTemplate.opsForValue().increment(key);
        if (n != null && n == 1L) {
            redisTemplate.expire(key, Duration.ofSeconds(cfg.getWindowSeconds()));
        }
        if (n != null && n > cfg.getMaxRequests()) {
            throw new RateLimitExceededException(
                    "Rate limit exceeded for " + action + ". Please try again later.");
        }
    }

    private void recordFailureRedis(AuthConfig.RateLimitSettings cfg, String identifier) {
        String countKey = "rl:fail:" + tenant() + ":" + identifier;
        Long n = redisTemplate.opsForValue().increment(countKey);
        if (n != null && n == 1L) {
            redisTemplate.expire(countKey, Duration.ofSeconds(cfg.getLockoutSeconds()));
        }
        if (n != null && n >= cfg.getMaxFailedLogins()) {
            redisTemplate.opsForValue().set("rl:lock:" + tenant() + ":" + identifier, "1",
                    Duration.ofSeconds(cfg.getLockoutSeconds()));
            log.warn("Identity '{}' locked out after {} failed attempts (redis)", identifier, n);
        }
    }

    private String key(String action, String identifier) {
        return tenant() + ":" + action + ":" + identifier;
    }

    private String lockKey(String identifier) {
        return tenant() + ":lock:" + identifier;
    }

    private String tenant() {
        String appCode = ai.nubase.common.context.MultiTenancyContext.getAppCode();
        return appCode != null ? appCode : "_";
    }

    /** Thrown when an auth rate limit or lockout is hit (mapped to HTTP 429). */
    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }
}
