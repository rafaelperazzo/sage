# SAGE Mobile — Scripts e Comandos

## Scripts disponíveis

### `update.sh` — Publicar atualização OTA
Envia uma atualização over-the-air via Expo Updates sem precisar gerar um novo build. Use para alterações em JS/assets (telas, lógica, textos).

```bash
./update.sh "descrição da mudança"
```

> Não use para mudanças nativas (novos pacotes, permissões, configurações do app.json).

---

### `build-and-submit.sh` — Build local + Submit na Play Store
Gera o build de produção localmente (`.aab`) e submete automaticamente à Play Store. Verifica se o repositório está limpo e sincronizado antes de prosseguir.

```bash
./build-and-submit.sh
```

> Requer `git commit` e `git push` de todas as alterações antes de executar.

---

### `build-submit.sh` — Build na nuvem EAS + Submit
Dispara o build de produção nos servidores do EAS e submete automaticamente à Play Store ao concluir. Não requer ambiente local configurado para compilação Android.

```bash
./build-submit.sh
```

---

### `prebuild.sh` — Prebuild limpo com correções
Executa `expo prebuild --clean` e aplica correções necessárias nos arquivos nativos gerados (`local.properties`, `build.gradle`, `MainApplication.kt`). Use quando precisar regenerar a pasta `android/` do zero.

```bash
./prebuild.sh
```

---

### `fix.sh` — Correção rápida de arquivos nativos
Aplica apenas o prebuild limpo sem as correções adicionais do `prebuild.sh`. Uso interno/emergencial.

```bash
./fix.sh
```

---

## Quando usar cada script

| Situação | Script |
|---|---|
| Corrigi um bug ou alterei uma tela | `update.sh` |
| Adicionei um pacote nativo ou alterei `app.json` | `build-and-submit.sh` |
| Quero buildar na nuvem sem configurar ambiente local | `build-submit.sh` |
| Preciso regenerar a pasta `android/` do zero | `prebuild.sh` |

---

## Versionamento

Antes de gerar um novo build nativo, atualize no `app.json`:

```json
"version": "X.Y.Z",
"runtimeVersion": "X.Y.Z"
```

- `version` / `runtimeVersion` — devem ser iguais e incrementadas a cada build publicado na Play Store
- `versionCode` — gerenciado automaticamente pelo EAS Build (`autoIncrement: true` no `eas.json`), não é necessário alterar manualmente
