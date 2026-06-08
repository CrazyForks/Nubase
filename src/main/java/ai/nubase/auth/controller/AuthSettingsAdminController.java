package ai.nubase.auth.controller;

import ai.nubase.auth.annotation.RequireServiceRole;
import ai.nubase.auth.service.EffectiveAuthConfig;
import ai.nubase.common.config.TenantAuthConfig;
import ai.nubase.common.context.MultiTenancyContext;
import ai.nubase.postgrest.multidb.DatabaseConfigRepository;
import cn.hutool.json.JSONUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Per-tenant authentication settings admin API (service_role only).
 *
 * <ul>
 *   <li>{@code GET    /auth/v1/admin/settings/auth} — the EFFECTIVE settings for the tenant
 *       (per-tenant override merged over global defaults)</li>
 *   <li>{@code PUT    /auth/v1/admin/settings/auth} — store a per-tenant override
 *       (TenantAuthConfig JSON; any null group inherits the global default)</li>
 *   <li>{@code DELETE /auth/v1/admin/settings/auth} — clear the override (revert to global)</li>
 * </ul>
 *
 * <p>Persisted in {@code database_configs.auth_config} and picked up on the next request by
 * {@code UnifiedMultiTenancyFilter} → {@link EffectiveAuthConfig}.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/v1/admin/settings/auth")
@RequireServiceRole
@Slf4j
public class AuthSettingsAdminController {

    private final EffectiveAuthConfig effectiveAuthConfig;
    private final DatabaseConfigRepository databaseConfigRepository;

    /** Return the effective auth settings for the current tenant. */
    @GetMapping
    public ResponseEntity<TenantAuthConfig> get() {
        TenantAuthConfig effective = new TenantAuthConfig();
        effective.setMfa(effectiveAuthConfig.mfa());
        effective.setOtp(effectiveAuthConfig.otp());
        effective.setSms(effectiveAuthConfig.sms());
        effective.setCaptcha(effectiveAuthConfig.captcha());
        effective.setRateLimit(effectiveAuthConfig.rateLimit());
        effective.setRedirect(effectiveAuthConfig.redirect());
        effective.setPassword(effectiveAuthConfig.password());
        effective.setEmailConfirmationRequired(effectiveAuthConfig.emailConfirmationRequired());
        effective.setDisableSignup(effectiveAuthConfig.signupDisabled());
        return ResponseEntity.ok(effective);
    }

    /** Replace the per-tenant override with the supplied settings. */
    @PutMapping
    public ResponseEntity<Map<String, Object>> put(@RequestBody TenantAuthConfig request) {
        String dbKey = MultiTenancyContext.getDatabaseKey();
        if (dbKey == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "tenant not resolved"));
        }
        databaseConfigRepository.updateAuthConfig(dbKey, JSONUtil.toJsonStr(request));
        log.info("Updated per-tenant auth settings for dbKey={}", dbKey);
        // Note: takes effect on the NEXT request (config is loaded by the tenant filter).
        return ResponseEntity.ok(Map.of("success", true, "db_key", dbKey));
    }

    /** Clear the per-tenant override; the tenant reverts to global defaults. */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clear() {
        String dbKey = MultiTenancyContext.getDatabaseKey();
        if (dbKey == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "tenant not resolved"));
        }
        databaseConfigRepository.updateAuthConfig(dbKey, null);
        log.info("Cleared per-tenant auth settings for dbKey={}", dbKey);
        return ResponseEntity.ok(Map.of("success", true, "db_key", dbKey));
    }
}
