package ai.nubase.cron.service;

import org.springframework.http.HttpStatus;

public final class CronExceptions {

    private CronExceptions() {
    }

    public static class CronException extends RuntimeException {

        private final HttpStatus status;
        private final String code;

        public CronException(HttpStatus status, String code, String message) {
            super(message);
            this.status = status;
            this.code = code;
        }

        public HttpStatus status() {
            return status;
        }

        public String code() {
            return code;
        }
    }
}
