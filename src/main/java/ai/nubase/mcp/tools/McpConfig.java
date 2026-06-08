package ai.nubase.mcp.tools;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpConfig {

    @Bean
    public ToolCallbackProvider toolProvider(DatabaseMcpTools databaseMcpTools,
                                             MemoryMcpTools memoryMcpTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(databaseMcpTools, memoryMcpTools)
                .build();
    }

}
