# 🎚️ Escala de Som — Igreja

Ferramenta interativa para gerenciar a escala de técnicos de som e aprendizes da igreja.

## Funcionalidades

- Seletor de mês com geração automática de datas (Sexta, Sábado, Domingo)
- Rodízio automático de técnicos e aprendizes
- Edição inline de qualquer campo (clique para editar)
- Gerenciamento de equipe (adicionar, editar, remover)
- Exportação em PNG para compartilhar no grupo
- Resumo de escalas por pessoa

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como subir no Vercel

### Passo 1 — Criar repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `escala-som`
3. Clique em **Create repository**
4. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/escala-som.git
git push -u origin main
```

### Passo 2 — Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `escala-som`
4. Framework Preset: **Vite** (detecta automaticamente)
5. Clique em **Deploy**
6. Em ~1 minuto seu site estará online em `escala-som.vercel.app`

### Atualizações
Qualquer `git push` na branch `main` faz deploy automático.
