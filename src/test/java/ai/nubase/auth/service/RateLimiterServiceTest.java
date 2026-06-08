package ai.nubase.auth.service;

import ai.nubase.common.config.AuthConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure unit tests for {@link RateLimiterService} (sliding-window cap + failed-login lockout).
 */
@DisplayName("RateLimiterService")
class RateLimiterServiceTest {

    private RateLimiterService limiter(int maxReq, int window, int maxFail, int lockout) {
        AuthConfig cfg = new AuthConfig();
        cfg.getRateLimit().setEnabled(true);
        cfg.getRateLimit().setMaxRequests(maxReq);
        cfg.getRateLimit().setWindowSeconds(window);
        cfg.getRateLimit().setMaxFailedLogins(maxFail);
        cfg.getRateLimit().setLockoutSeconds(lockout);
        return new RateLimiterService(new EffectiveAuthConfig(cfg));
    }

    @Test
    @DisplayName("checkRate allows up to the cap, then throws")
    void rateCap() {
        RateLimiterService rl = limiter(2, 300, 5, 900);
        assertThatCode(() -> rl.checkRate("otp", "a@x.com")).doesNotThrowAnyException();
        assertThatCode(() -> rl.checkRate("otp", "a@x.com")).doesNotThrowAnyException();
        assertThatThrownBy(() -> rl.checkRate("otp", "a@x.com"))
                .isInstanceOf(RateLimiterService.RateLimitExceededException.class);
    }

    @Test
    @DisplayName("checkRate buckets are independent per action and identifier")
    void independentBuckets() {
        RateLimiterService rl = limiter(1, 300, 5, 900);
        assertThatCode(() -> rl.checkRate("otp", "a@x.com")).doesNotThrowAnyException();
        // different identifier — own bucket
        assertThatCode(() -> rl.checkRate("otp", "b@x.com")).doesNotThrowAnyException();
        // different action — own bucket
        assertThatCode(() -> rl.checkRate("recover", "a@x.com")).doesNotThrowAnyException();
        // same action+identifier again — over cap
        assertThatThrownBy(() -> rl.checkRate("otp", "a@x.com"))
                .isInstanceOf(RateLimiterService.RateLimitExceededException.class);
    }

    @Test
    @DisplayName("lockout triggers after maxFailedLogins and clears on success")
    void lockout() {
        RateLimiterService rl = limiter(100, 300, 3, 900);
        String id = "victim@x.com";
        assertThatCode(() -> rl.assertNotLockedOut(id)).doesNotThrowAnyException();

        rl.recordFailure(id);
        rl.recordFailure(id);
        assertThatCode(() -> rl.assertNotLockedOut(id)).doesNotThrowAnyException(); // 2 < 3
        rl.recordFailure(id);
        assertThatThrownBy(() -> rl.assertNotLockedOut(id))
                .isInstanceOf(RateLimiterService.RateLimitExceededException.class); // 3 >= 3 → locked

        rl.recordSuccess(id);
        assertThatCode(() -> rl.assertNotLockedOut(id)).doesNotThrowAnyException(); // cleared
    }

    @Test
    @DisplayName("disabled limiter never throttles or locks out")
    void disabled() {
        AuthConfig cfg = new AuthConfig();
        cfg.getRateLimit().setEnabled(false);
        cfg.getRateLimit().setMaxRequests(1);
        cfg.getRateLimit().setMaxFailedLogins(1);
        RateLimiterService rl = new RateLimiterService(new EffectiveAuthConfig(cfg));

        for (int i = 0; i < 10; i++) {
            int finalI = i;
            assertThatCode(() -> rl.checkRate("otp", "a@x.com")).doesNotThrowAnyException();
            rl.recordFailure("a@x.com");
        }
        assertThatCode(() -> rl.assertNotLockedOut("a@x.com")).doesNotThrowAnyException();
    }
}
