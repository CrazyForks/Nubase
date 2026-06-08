package ai.nubase.auth.controller;

import ai.nubase.auth.dto.request.platform.PlatformSignInRequest;
import ai.nubase.auth.dto.request.platform.PlatformSignUpRequest;
import ai.nubase.auth.dto.response.platform.PlatformAuthResponse;
import ai.nubase.auth.dto.response.platform.PlatformUserPayload;
import ai.nubase.auth.exception.EmailAlreadyExistsException;
import ai.nubase.auth.service.PlatformAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static ai.nubase.test.ControllerTestSupport.json;
import static ai.nubase.test.ControllerTestSupport.mockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlatformAuthControllerTest {

    private PlatformAuthService platformAuthService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        platformAuthService = mock(PlatformAuthService.class);
        mvc = mockMvc(new PlatformAuthController(platformAuthService));
    }

    @Test
    void publicConfigReturnsSignupFlag() throws Exception {
        when(platformAuthService.isSignupEnabled()).thenReturn(true);

        mvc.perform(get("/auth/v1/platform/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signup_enabled").value(true));
    }

    @Test
    void signUpCreatesPlatformUserSession() throws Exception {
        when(platformAuthService.signUp(any(PlatformSignUpRequest.class))).thenReturn(authResponse());

        mvc.perform(post("/auth/v1/platform/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(signUpRequest("admin@example.com", "password123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("platform-token"))
                .andExpect(jsonPath("$.token_type").value("bearer"))
                .andExpect(jsonPath("$.user.email").value("admin@example.com"))
                .andExpect(jsonPath("$.user.full_name").value("Admin User"));
    }

    @Test
    void signUpRejectsDuplicateEmail() throws Exception {
        when(platformAuthService.signUp(any(PlatformSignUpRequest.class)))
                .thenThrow(new EmailAlreadyExistsException("Email already exists"));

        mvc.perform(post("/auth/v1/platform/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(signUpRequest("admin@example.com", "password123"))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("user_exists"))
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    void signUpValidatesEmailAndPassword() throws Exception {
        mvc.perform(post("/auth/v1/platform/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(signUpRequest("bad-email", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void tokenReturnsSessionForPasswordLogin() throws Exception {
        when(platformAuthService.signIn(any(PlatformSignInRequest.class))).thenReturn(authResponse());

        mvc.perform(post("/auth/v1/platform/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(signInRequest("admin@example.com", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("platform-token"))
                .andExpect(jsonPath("$.user.email").value("admin@example.com"));
    }

    @Test
    void tokenReturnsUnauthorizedForInvalidCredentials() throws Exception {
        when(platformAuthService.signIn(any(PlatformSignInRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid email or password"));

        mvc.perform(post("/auth/v1/platform/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(signInRequest("admin@example.com", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    void meRequiresBearerToken() throws Exception {
        mvc.perform(get("/auth/v1/platform/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("missing_token"));
    }

    @Test
    void meDescribesBearerSubject() throws Exception {
        UUID userId = UUID.randomUUID();
        when(platformAuthService.validateAndGetSubject("valid-token")).thenReturn(userId);
        when(platformAuthService.describe(userId)).thenReturn(userPayload());

        mvc.perform(get("/auth/v1/platform/me")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@example.com"));

        verify(platformAuthService).describe(userId);
    }

    private PlatformSignUpRequest signUpRequest(String email, String password) {
        PlatformSignUpRequest request = new PlatformSignUpRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setFullName("Admin User");
        return request;
    }

    private PlatformSignInRequest signInRequest(String email, String password) {
        PlatformSignInRequest request = new PlatformSignInRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private PlatformAuthResponse authResponse() {
        return PlatformAuthResponse.builder()
                .accessToken("platform-token")
                .tokenType("bearer")
                .expiresIn(86400)
                .user(userPayload())
                .build();
    }

    private PlatformUserPayload userPayload() {
        return PlatformUserPayload.builder()
                .id(UUID.randomUUID().toString())
                .email("admin@example.com")
                .fullName("Admin User")
                .role("super_admin")
                .createdAt(Instant.parse("2026-05-24T00:00:00Z"))
                .build();
    }
}
