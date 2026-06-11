package ai.nubase.cron.service;

import ai.nubase.common.context.MultiTenancyContext;
import ai.nubase.common.enums.DatabaseInitStatus;
import ai.nubase.postgrest.multidb.DatabaseConfig;
import ai.nubase.postgrest.multidb.DatabaseConfigRepository;
import ai.nubase.postgrest.multidb.RoutingDataSource;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.Callable;

/**
 * Establishes a tenant MultiTenancyContext for background work, mirroring what
 * UnifiedMultiTenancyFilter does for HTTP requests (config lookup, lazy routing
 * datasource registration, context binding). Cron jobs run with service-role
 * privileges — they are platform-initiated, like Supabase's pg_cron jobs which
 * call functions with the service key.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(value = "nubase.cron.enabled", havingValue = "true", matchIfMissing = true)
public class CronTenantContext {

    private final DatabaseConfigRepository databaseConfigRepository;
    private final RoutingDataSource routingDataSource;

    public <T> T runAs(String projectRef, Callable<T> action) throws Exception {
        DatabaseConfig config = databaseConfigRepository.findByAppCode(projectRef);
        if (config == null || !config.isAvailable()) {
            throw new IllegalStateException("Tenant not available: " + projectRef);
        }
        if (DatabaseInitStatus.INITIALIZED.name().equals(config.getInitStatus())) {
            if (!routingDataSource.hasDataSource(config.getDbKey())) {
                routingDataSource.initializeDataSource(config);
            }
            routingDataSource.recordAccess(config.getDbKey());
        }
        MultiTenancyContext.ContextData contextData = MultiTenancyContext.ContextData.builder()
                .appCode(projectRef)
                .schemaName(config.getSchemaName())
                .jwtSecret(config.getJwtSecret())
                .jwtSecretKey(Keys.hmacShaKeyFor(config.getJwtSecret().getBytes(StandardCharsets.UTF_8)))
                .databaseKey(config.getDbKey())
                .databaseConfig(config)
                .serviceRole(true)
                .build();
        MultiTenancyContext.setContext(contextData);
        try {
            return action.call();
        } finally {
            MultiTenancyContext.clear();
        }
    }
}
