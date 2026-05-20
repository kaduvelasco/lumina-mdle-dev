# Contribuindo com o Lumina Moodle Developer

🇺🇸 [Read in English](./CONTRIBUTING.md)  |  [← Voltar ao LEIAME](./LEIAME.md)

---

Obrigado pelo interesse em contribuir com o **Lumina Moodle Developer**! Este projeto é mantido por um desenvolvedor Moodle para a comunidade de desenvolvedores Moodle — toda contribuição, por menor que seja, é muito bem-vinda.

## Formas de contribuir

- **Relatórios de bug** — abra uma issue descrevendo o que aconteceu e como reproduzir
- **Sugestões de feature** — abra uma issue descrevendo o caso de uso e o comportamento esperado
- **Pull requests** — faça um fork, crie uma branch, implemente e abra um PR
- **Documentação** — correções, traduções e melhorias nos arquivos em `docs/`
- **Exemplos** — novos prompts ou fluxos de trabalho úteis para a comunidade

## Configuração do ambiente

```bash
git clone https://github.com/kaduvelasco/lumina-mdle-dev.git
cd lumina-mdle-dev
chmod +x setup.sh
./setup.sh
```

O `setup.sh` verifica as dependências, instala os pacotes e compila o TypeScript automaticamente.

## Entendendo a arquitetura

Antes de contribuir com código, recomenda-se ler os documentos de arquitetura interna:

- [Extractors](./docs/pt-br/architecture/extractors.md) — como os arquivos PHP do Moodle são lidos e interpretados
- [Generators](./docs/pt-br/architecture/generators.md) — como os arquivos `.md` de contexto são gerados
- [Sistema de Cache](./docs/pt-br/architecture/cache-system.md) — estratégia de cache por mtime e invalidação

O diretório `src/utils/` contém módulos compartilhados usados entre as camadas:

| Módulo | Finalidade |
|--------|-----------|
| `utils/php-parser.ts` | Helpers compartilhados de parsing de arrays PHP (`extractArrayBody`, `splitIntoBlocks`, `extractString`, `extractInt`, `extractBool`) usados por todos os extractors de `db/*.php` |
| `utils/generator-helpers.ts` | Utilitários compartilhados de geração (`write`, `timestamp`, `header`, `safely`, `GeneratorResult`) usados pelos dois módulos de generator |
| `utils/plugin-types.ts` | Mapa canônico de tipo de plugin → diretório e resolver `resolvePluginPath`, usados por tools, extractors e resources |

Ao adicionar um novo extractor para um arquivo `db/*.php`, use os helpers de `utils/php-parser.ts` em vez de reimplementá-los. Ao adicionar um novo generator, importe de `utils/generator-helpers.ts`.

## Diretrizes

- Siga o estilo TypeScript existente — a configuração do ESLint está incluída no repositório
- Adicione ou atualize testes em `src/tests/` para qualquer alteração em extractors ou generators
- Execute `npm run build && npm test` antes de enviar — PRs com falhas de build não serão aceitos
- Mantenha os commits focados — uma alteração lógica por commit
- Escreva mensagens de commit em inglês no formato imperativo (`feat:`, `fix:`, `docs:`)

## Executando os testes

```bash
npm test              # executar todos os testes
npm run test:watch    # modo watch
npm run typecheck     # apenas verificação de tipos (sem gerar arquivos)
npm run build         # compilar TypeScript → dist/
```

## Enviando um PR

1. Faça um fork do repositório
2. Crie uma branch descritiva: `git checkout -b feat/minha-feature`
3. Implemente suas alterações e adicione testes quando aplicável
4. Execute `npm run build && npm test` e confirme que tudo passa
5. Faça push e abra um Pull Request contra a branch `main`
6. Descreva claramente o que foi alterado e por quê

---

[← Voltar ao LEIAME](./LEIAME.md)

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
