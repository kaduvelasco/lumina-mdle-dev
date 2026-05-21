🌐 [English](../../../en/guides/clients/antigravity.md) | **Português (BR)** | 🏠 [Índice](../../index.md)

---

# Usando com Antigravity CLI

O **Antigravity CLI** (`agy`) é o agente de IA em terminal desenvolvido pelo Google em Go, sucessor do Gemini CLI. Ele lê as definições de servidores MCP a partir do seu arquivo global de configuração.

---

## 🛠️ Configuração do Servidor MCP

Abra ou crie o arquivo de configuração global:

| Sistema operacional | Caminho |
|---------------------|---------|
| Linux / macOS | `~/.gemini/antigravity/mcp_config.json` |
| Windows | `%USERPROFILE%\.gemini\antigravity\mcp_config.json` |

Adicione o servidor sob o bloco `mcpServers`:

**Via NPM:**

```json
{
    "mcpServers": {
        "lumina-mdle-dev": {
            "command": "npx",
            "args": ["-y", "lumina-mdle-dev"],
            "env": {
                "MOODLE_PATH": "/caminho/para/seu/moodle"
            }
        }
    }
}
```

**Via repositório clonado:**

```json
{
    "mcpServers": {
        "lumina-mdle-dev": {
            "command": "node",
            "args": ["/caminho/absoluto/para/lumina-mdle-dev/dist/index.js"],
            "env": {
                "MOODLE_PATH": "/caminho/para/seu/moodle"
            }
        }
    }
}
```

> **Problema com nvm / mise / asdf:** o Antigravity CLI herda o ambiente do processo pai, que pode não incluir o PATH do seu shell. Se `npx` não for encontrado, adicione o PATH explicitamente:
> ```json
> "env": {
>     "PATH": "/home/usuario/.nvm/versions/node/v22.0.0/bin:/usr/local/bin:/usr/bin:/bin",
>     "MOODLE_PATH": "/caminho/para/seu/moodle"
> }
> ```
> Execute `which node` no terminal para encontrar o caminho correto.

### Após configurar

Reinicie a sessão do Antigravity CLI (`Ctrl+C` e `agy` novamente) para carregar o novo servidor.

---

## 💡 Fluxos de Trabalho Recomendados

### Iniciando uma sessão de desenvolvimento

No início de cada sessão, carregue o contexto do plugin:

```
Estou trabalhando no plugin local_myplugin. Carregue o contexto completo.
```

O Antigravity CLI chamará `get_plugin_info` e passará a conhecer a arquitetura, banco de dados, funções e padrões do plugin.

### Consultando a API do core

```
Quais funções da API do core devo usar para verificar se um usuário
está matriculado em um curso? Prefira funções públicas e não depreciadas.
```

O Antigravity CLI usará `search_api` e retornará as funções com assinaturas e arquivos fonte.

### Consultando a estrutura do banco

```
Quais são os campos da tabela mdl_course? Use o lumina-mdle-dev para verificar.
```

O Antigravity CLI consultará o resource `moodle://db-tables` sem necessidade de abrir o banco de dados.

### Criação de novos plugins com slash command

Use o slash command diretamente:

```
/scaffold_plugin type="local" name="web_service_test" description="Plugin de teste de web services" features="web services, capabilities"
```

Após criar os arquivos, gere o contexto:

```
Gere o contexto de IA para o plugin local_web_service_test.
```

### Revisão antes de um commit

```
/review_plugin plugin="local/myplugin" focus="security"
```

---

## ⚠️ Solução de Problemas

### Primeiro passo: verificar a conexão

Digite `/mcp` no chat. Se `lumina-mdle-dev` não aparecer, o problema está na configuração — não no seu prompt.

### O servidor não aparece após configurar

Abra `~/.gemini/antigravity/mcp_config.json` e verifique o formato:

**Via NPM (sem nvm/mise/asdf):**
```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "npx",
      "args": ["-y", "lumina-mdle-dev"],
      "env": { "MOODLE_PATH": "/caminho/absoluto/para/seu/moodle" }
    }
  }
}
```

**Via repositório clonado ou com nvm/mise/asdf (recomendado):**
```json
{
  "mcpServers": {
    "lumina-mdle-dev": {
      "command": "/caminho/absoluto/para/node",
      "args": ["/caminho/absoluto/para/lumina-mdle-dev/dist/index.js"],
      "env": { "MOODLE_PATH": "/caminho/absoluto/para/seu/moodle" }
    }
  }
}
```

> Use `which node` no terminal para obter o caminho absoluto do `node`.

Após corrigir, reinicie a sessão do `agy`.

### Caminhos relativos não funcionam

O `mcp_config.json` exige caminhos **absolutos**. Caminhos relativos como `./dist/index.js` não são resolvidos pelo Antigravity CLI.

### MOODLE_PATH incorreto

Certifique-se de que `MOODLE_PATH` aponta para o diretório que contém o arquivo `version.php`. O servidor falha silenciosamente se não conseguir validar a instalação.

### Contexto desatualizado após mudanças

- **Novo plugin instalado:** _"Regenere todos os índices globais do Moodle."_ → `update_indexes`
- **Mudanças em um plugin:** _"Regenere o contexto do plugin local_myplugin."_ → `generate_plugin_context`

---

## ➡️ Próximos Passos

- [Claude Code](./claude-code.md) — CLI da Anthropic com suporte nativo a MCP
- [OpenAI Codex](./codex.md) — CLI da OpenAI com configuração TOML
- [OpenCode](./opencode.md) — agente open source com interface TUI
- [Exemplos de workflows](../workflows/examples.md) — casos de uso reais e prompts prontos
- [Referência de Tools](../../reference/tools.md) — parâmetros completos de todas as tools
- [Problemas Comuns](../../troubleshooting/common-issues.md) — troubleshooting detalhado
- [Voltar ao Índice](../../index.md)

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
