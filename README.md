# MAD — Moda & Style 💗

Aplicativo de moda Y2K, rosa-choque e branco. **Versão 1.0 em desenvolvimento.**

## Funcionalidades do código
- Tela inicial com **Criar conta** e **Entrar**; e-mail, senha e aceite explícito dos textos legais.
- Autenticação por e-mail e senha no Supabase (com confirmação por e-mail se ativada).
- Feed de looks, Explorar, Publicar (galeria/câmera), Salvos e Perfil.
- Upload de fotos no Storage privado; URLs temporárias para contas autenticadas.
- Marca, peça, preço informado pela pessoa e link https para a loja, quando disponíveis.
- Modo demonstração para conferir o visual antes de configurar Supabase.

## Instalar
1. Instale Node.js 22 e rode `npm install`.
2. No **Supabase SQL Editor**, execute `supabase/migrations/202611040001_mad_v1.sql`.
3. No Supabase > Connect / Project Settings > API, copie **Project URL** e a **publishable key**.
4. Crie `.env` copiando `.env.example` e complete com sua URL e **publishable key**. **Nunca use a service_role key.**
5. No Supabase Auth, habilite login por e-mail e configure redirect, confirmação de e-mail, rate limits e proteção anti-abuso.
6. Rode `npx expo start` para abrir no Expo Go.

## APK Android 1.0 (teste)
Em GitHub > **Actions** > **MAD Android APK 1.0 (teste)**, acompanhe o build automático. Em um job concluído, baixe o artifact **MAD-v1.0-debug-apk** e extraia o APK. É build de depuração, não uma versão assinada para distribuição na Play Store.

O workflow aceita GitHub Actions secrets `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sem eles o APK será de demonstração: não fará login/cadastro nem gravará fotos. Também é possível gerar um APK via EAS:
```bash
npm install
npx eas-cli build -p android --profile preview
```
Esse comando requer acesso e configuração de uma conta Expo.

## Limitações importantes
- A migração SQL ainda precisa ser executada no seu projeto Supabase. O código não executa alterações remotas por conta própria.
- As fotos e capas reais serão adicionadas quando você enviá-las, com autorização de uso.
- A análise automática de roupa por imagem, catálogo verificado e preços automáticos **não estão implementados**.
- Os textos legais são **rascunhos**, precisam de revisão jurídica e não devem ser usados em lançamento público.
- Para publicar um app de comunidade são necessárias rotinas de denúncias, moderação, exclusão de contas/dados e proteção de adolescentes.
- Teste o login, o upload e as permissões do banco antes de oferecer a outras pessoas.

## Organização
`App.tsx` / `src/` — telas e lógica
`supabase/migrations/` — tabelas, RLS e Storage
`eas.json` — perfil APK do EAS
`.github/workflows/` — compilação automática do APK de teste
