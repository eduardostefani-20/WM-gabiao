# WM Gabião — Site institucional

Site estático (HTML5, CSS3 e JavaScript puro, sem frameworks) da **WM Gabião & Construção LTDA**, com painel administrativo e banco de dados no Supabase.

## Estrutura

```
/wm-gabiao
│
├── index.html              # Site público
├── admin.html              # Painel administrativo
├── css/
│   ├── style.css           # Estilos do site
│   └── admin.css           # Estilos do painel
├── js/
│   ├── config.js           # Configuração do Supabase (compartilhada)
│   ├── data.js             # Conteúdo padrão (textos, obras e clientes)
│   ├── script.js           # Comportamento do site
│   ├── portfolio-pdf.js    # Gera o portfólio em PDF no navegador
│   └── admin.js            # Comportamento do painel
├── assets/
│   ├── portfolio/          # Fotos das obras (portfólio oficial)
│   ├── clients/            # Logos de clientes
│   ├── fonts/              # Fontes usadas no PDF (Bebas Neue e Montserrat)
│   ├── icons/              # favicon-wm.png
│   └── logo/               # logo-wm-portfolio.png
├── supabase/
│   └── schema.sql          # Tabelas, permissões e conteúdo inicial
├── netlify.toml            # Deploy no Netlify
└── .github/workflows/      # Deploy no GitHub Pages
```

## Como visualizar

```bash
npx serve .
# ou
python3 -m http.server
```

## Como o conteúdo funciona

O site já traz um conteúdo padrão em `js/data.js`. Quando o Supabase responde, o que estiver salvo no banco substitui esse padrão. Assim o site continua no ar mesmo se o banco estiver fora do ar.

| Tabela | Uso |
|---|---|
| `site_content` | Todos os textos, contatos, indicadores e fotos de fundo |
| `portfolio_projects` | Obras do portfólio (várias fotos por obra) |
| `clients` | Clientes da faixa animada (nome e logo) |
| `solicitacoes` | Pedidos de orçamento enviados pelo formulário |
| `admin_users` | Quem pode editar o site |

As fotos enviadas pelo painel ficam no bucket público `site-media` do Supabase Storage. O painel reduz as fotos para no máximo 1600 px antes de enviar.

## Painel administrativo (`admin.html`)

- **Solicitações**: buscar, filtrar, marcar como atendida e excluir.
- **Textos e fotos**: editar todos os textos do site e trocar as fotos de fundo.
- **Portfólio**: criar, editar, ocultar e excluir obras; enviar fotos e escolher a capa.
- **Clientes**: adicionar e remover clientes, mudar a ordem e enviar logos.

O botão **Baixar portfólio em PDF** do site gera o PDF na hora, com os dados atuais, no padrão visual do portfólio original.

### Configuração do Supabase

1. Abra o SQL Editor do projeto e execute `supabase/schema.sql` (pode ser executado mais de uma vez).
2. Em Authentication > Users, crie o usuário administrador.
3. Torne esse usuário administrador:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'email@exemplo.com';
   ```
4. Acesse `admin.html` e entre com esse usuário.

A chave em `js/config.js` é uma chave publicável. Nunca coloque uma chave `service_role` no HTML ou JavaScript.

## Identidade visual

| Uso | Cor |
|---|---|
| Fundo | `#0E0E0E` / `#161616` |
| Painéis | `#1E1E1E` |
| Texto | `#F4F2EC` |
| Amarelo (destaque) | `#F2B233` |
| Amarelo da logo | `#FFC300` |

- Títulos: **Bebas Neue**
- Texto: **Montserrat**
