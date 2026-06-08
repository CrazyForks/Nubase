package ai.nubase.auth.service;

import ai.nubase.common.config.AuthConfig;
import ai.nubase.common.config.TenantAuthConfig;
import ai.nubase.common.context.MultiTenancyContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link EffectiveAuthConfig}: per-tenant override layered over global defaults.
 */
@DisplayName("EffectiveAuthConfig")
class EffectiveAuthConfigTest {

    private final AuthConfig global = new AuthConfig();
    private final EffectiveAuthConfig effective = new EffectiveAuthConfig(global);

    @AfterEach
    void clear() {
        MultiTenancyContext.clear();
    }

    private void setTenant(TenantAuthConfig tac) {
        MultiTenancyContext.setContext(MultiTenancyContext.ContextData.builder()
                .appCode("demo").schemaName("public").jwtSecret("s")
                .tenantAuthConfig(tac).build());
    }

    @Test
    @DisplayName("no tenant context → global defaults")
    void globalDefaults() {
        assertThat(effective.mfa().isEnabled()).isEqualTo(global.getMfa().isEnabled());
        assertThat(effective.otp().getLength()).isEqualTo(global.getOtp().getLength());
        assertThat(effective.signupDisabled()).isFalse();
        assertThat(effective.emailConfirmationRequired()).isTrue();
    }

    @Test
    @DisplayName("tenant with no override inherits global")
    void emptyOverrideInherits() {
        setTenant(new TenantAuthConfig());
        assertThat(effective.mfa()).isSameAs(global.getMfa());
        assertThat(effective.rateLimit()).isSameAs(global.getRateLimit());
        assertThat(effective.signupDisabled()).isFalse();
    }

    @Test
    @DisplayName("tenant override wins over global, group by group")
    void overrideWins() {
        TenantAuthConfig tac = new TenantAuthConfig();
        AuthConfig.OtpSettings otp = new AuthConfig.OtpSettings();
        otp.setLength(8);
        otp.setExpiration(120);
        tac.setOtp(otp);
        tac.setDisableSignup(true);
        tac.setEmailConfirmationRequired(false);
        setTenant(tac);

        assertThat(effective.otp().getLength()).isEqualTo(8);           // overridden
        assertThat(effective.otp().getExpiration()).isEqualTo(120);
        assertThat(effective.mfa()).isSameAs(global.getMfa());          // not overridden → global
        assertThat(effective.signupDisabled()).isTrue();
        assertThat(effective.emailConfirmationRequired()).isFalse();
    }
}
