package ai.nubase.mcp.tools;

import ai.nubase.mcp.safety.SqlRiskClassifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseMcpToolsTest {

    private DatabaseMcpTools tools;

    @BeforeEach
    void setUp() {
        tools = new DatabaseMcpTools(null, null, null, null, new SqlRiskClassifier());
    }

    @Test
    void executeSqlDryRunReturnsRiskWithoutDatabaseContext() {
        Object raw = tools.executeSqlDryRun("select * from todos; create table notes(id bigint);");

        assertThat(raw).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) raw;
        assertThat(response).containsEntry("success", true);
        assertThat(response).containsEntry("risk", "SCHEMA_WRITE");
        assertThat(response).containsEntry("statementCount", 2);
        assertThat(response).containsEntry("executable", true);
    }

    @Test
    void executeSqlDryRunMarksDangerousSqlNotExecutable() {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = (Map<String, Object>) tools.executeSqlDryRun("drop table todos");

        assertThat(response).containsEntry("success", true);
        assertThat(response).containsEntry("risk", "DANGEROUS");
        assertThat(response).containsEntry("executable", false);
    }
}
