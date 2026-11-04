# MAD Closet — versão 2 (em desenvolvimento)

Protótipo Expo React Native com filtros por estilo, descrição individual de peças e favoritos locais (não persistidos após fechar o app). As fotografias originais ainda precisam ser incorporadas como arquivos de imagem; placeholders indicam onde aparecerão.

## Executar

```bash
npm install
npx expo start
```

## Gerar APK (requer conta Expo/EAS e credenciais Android)

```bash
npm install
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

O APK só estará disponível depois de uma build bem-sucedida no EAS. Nenhuma build foi executada por este commit.

## Supabase

Nenhuma alteração no banco é necessária para visualizar o catálogo local. Login, perfis, uploads e favoritos persistentes ainda precisam ser implementados e testados. Não inclua a chave service_role no aplicativo. Antes de conectar o Supabase, verifique URL do projeto, chave publicável/anon, tabelas e políticas RLS. Não apague dados existentes.
