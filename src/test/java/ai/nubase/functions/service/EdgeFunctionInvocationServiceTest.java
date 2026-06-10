package ai.nubase.functions.service;

import ai.nubase.common.context.MultiTenancyContext;
import ai.nubase.functions.executor.EdgeFunctionExecutorRouter;
import ai.nubase.functions.executor.EdgeFunctionInvocationRequest;
import ai.nubase.functions.executor.EdgeFunctionInvocationResponse;
import ai.nubase.metadata.edge.entity.EdgeFunction;
import ai.nubase.metadata.edge.entity.EdgeFunctionInvocation;
import ai.nubase.metadata.edge.entity.EdgeFunctionVersion;
import ai.nubase.metadata.edge.repository.EdgeFunctionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Map;
import java.util.Optional;

import static ai.nubase.functions.service.EdgeFunctionExceptions.EdgeFunctionException;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EdgeFunctionInvocationServiceTest {

    @Mock
    private EdgeFunctionRepository functionRepository;
    @Mock
    private EdgeFunctionInvocationLogWriter logWriter;
    @Mock
    private EdgeFunctionExecutorRouter executor;
    @Mock
    private HeaderSanitizer headerSanitizer;
    @Mock
    private EdgeFunctionRateLimiter rateLimiter;
    @Mock
    private EdgeFunctionSecretEnv secretEnv;

    private EdgeFunctionInvocationService service;

    @BeforeEach
    void setUp() {
        service = new EdgeFunctionInvocationService(
                functionRepository, logWriter, executor, headerSanitizer, rateLimiter, secretEnv);
        MultiTenancyContext.setContext(MultiTenancyContext.ContextData.builder().appCode("app1").build());
        lenient().when(executor.provider()).thenReturn("local");
    }

    @AfterEach
    void tearDown() {
        MultiTenancyContext.clear();
    }

    @Test
    void secretsAreInjectedForInvokeTimeExecutorsAndCannotShadowBuiltins() {
        EdgeFunction function = deployedFunction();
        when(functionRepository.findByProjectRefAndSlug("app1", "hello")).thenReturn(Optional.of(function));
        when(executor.injectsEnvAtInvoke()).thenReturn(true);
        when(secretEnv.decryptedEnv(function)).thenReturn(Map.of(
                "API_KEY", "s3cret",
                "NUBASE_PROJECT_REF", "shadow-attempt"
        ));
        when(headerSanitizer.forwardableHeaders(any())).thenReturn(Map.of());
        when(executor.invoke(any())).thenReturn(new EdgeFunctionInvocationResponse(200, Map.of(), new byte[0], null, null));

        service.invoke("hello", "", new byte[0], new MockHttpServletRequest("POST", "/functions/v1/hello"));

        ArgumentCaptor<EdgeFunctionInvocationRequest> captor = ArgumentCaptor.forClass(EdgeFunctionInvocationRequest.class);
        verify(executor).invoke(captor.capture());
        Map<String, String> env = captor.getValue().env();
        assertThat(env).containsEntry("API_KEY", "s3cret");
        assertThat(env).containsEntry("NUBASE_PROJECT_REF", "app1");
        assertThat(env).containsEntry("NUBASE_FUNCTION_NAME", "hello");
    }

    @Test
    void secretsAreNotDecryptedForDeployTimeExecutors() {
        EdgeFunction function = deployedFunction();
        when(functionRepository.findByProjectRefAndSlug("app1", "hello")).thenReturn(Optional.of(function));
        when(executor.injectsEnvAtInvoke()).thenReturn(false);
        when(headerSanitizer.forwardableHeaders(any())).thenReturn(Map.of());
        when(executor.invoke(any())).thenReturn(new EdgeFunctionInvocationResponse(200, Map.of(), new byte[0], null, null));

        service.invoke("hello", "", new byte[0], new MockHttpServletRequest("POST", "/functions/v1/hello"));

        verify(secretEnv, never()).decryptedEnv(any());
    }

    @Test
    void failedInvocationIsStillLogged() {
        when(functionRepository.findByProjectRefAndSlug("app1", "missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.invoke("missing", "", new byte[0],
                new MockHttpServletRequest("GET", "/functions/v1/missing")))
                .isInstanceOf(EdgeFunctionException.class);

        ArgumentCaptor<EdgeFunctionInvocation> captor = ArgumentCaptor.forClass(EdgeFunctionInvocation.class);
        verify(logWriter).write(captor.capture());
        assertThat(captor.getValue().getStatusCode()).isEqualTo(404);
        assertThat(captor.getValue().getErrorCode()).isEqualTo("FUNCTION_NOT_FOUND");
    }

    @Test
    void logWriterFailureDoesNotFailTheInvocation() {
        EdgeFunction function = deployedFunction();
        when(functionRepository.findByProjectRefAndSlug("app1", "hello")).thenReturn(Optional.of(function));
        when(headerSanitizer.forwardableHeaders(any())).thenReturn(Map.of());
        when(executor.invoke(any())).thenReturn(new EdgeFunctionInvocationResponse(200, Map.of(), new byte[0], null, null));
        org.mockito.Mockito.doThrow(new RuntimeException("db down")).when(logWriter).write(any());

        EdgeFunctionInvocationResponse response = service.invoke("hello", "", new byte[0],
                new MockHttpServletRequest("POST", "/functions/v1/hello"));

        assertThat(response.statusCode()).isEqualTo(200);
    }

    private EdgeFunction deployedFunction() {
        EdgeFunctionVersion version = EdgeFunctionVersion.builder()
                .status("deployed")
                .providerDeploymentId("app1/hello")
                .build();
        return EdgeFunction.builder()
                .projectRef("app1")
                .slug("hello")
                .name("hello")
                .enabled(true)
                .verifyJwt(false)
                .activeVersion(version)
                .build();
    }
}
