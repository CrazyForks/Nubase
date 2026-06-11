package ai.nubase.functions.service;

import ai.nubase.metadata.edge.entity.EdgeFunction;
import ai.nubase.metadata.edge.entity.EdgeFunctionSecret;
import ai.nubase.metadata.edge.repository.EdgeFunctionSecretRepository;
import ai.nubase.postgrest.multidb.EncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

import static ai.nubase.functions.service.EdgeFunctionExceptions.EdgeFunctionException;

/**
 * Loads and decrypts a function's secrets into an env map. Shared by the admin
 * (deploy/sync) and invocation (local executor env injection) paths.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(value = "nubase.functions.enabled", havingValue = "true", matchIfMissing = true)
public class EdgeFunctionSecretEnv {

    private final EdgeFunctionSecretRepository secretRepository;
    private final EncryptionService encryptionService;

    public Map<String, String> decryptedEnv(EdgeFunction fn) {
        Map<String, String> env = new LinkedHashMap<>();
        for (EdgeFunctionSecret secret : secretRepository.findByFunctionOrderByNameAsc(fn)) {
            try {
                env.put(secret.getName(), encryptionService.decrypt(secret.getEncryptedValue()));
            } catch (Exception e) {
                throw new EdgeFunctionException(HttpStatus.INTERNAL_SERVER_ERROR, "SECRET_DECRYPTION_FAILED", "Failed to decrypt function secret");
            }
        }
        return env;
    }
}
