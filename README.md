# WM Gabião — Site institucional

Site institucional estático (HTML5, CSS3 e JavaScript puro, sem frameworks) para a **WM Gabião & Construção LTDA**.

## Estrutura

```
/wm-gabiao
│
├── index.html            # Site público
├── admin.html            # Painel de solicitações de orçamento
├── css/
│   ├── style.css         # Estilos do site
│   └── admin.css         # Estilos do painel
├── js/
│   ├── config.js         # Configuração do Supabase (compartilhada)
│   ├── script.js         # Comportamento do site
│   └── admin.js          # Comportamento do painel
├── assets/
│   ├── images/           # Fotos das obras (nomes em minúsculas, sem espaços)
│   ├── icons/            # favicon.png
│   └── logo/             # logo-wm-gabiao.png
├── supabase/
│   └── schema.sql        # Tabelas, permissões e dados iniciais
├── netlify.toml          # Deploy no Netlify
└── .github/workflows/    # Deploy no GitHub Pages
```

### Convenções

- Nomes de arquivos de imagem em minúsculas, com hífens e sem acentos (ex.: `muro-contencao.jpg`).
- Fotos otimizadas para a web (máx. 1600 px, JPEG ~80%) antes de serem adicionadas.
- A configuração do Supabase fica apenas em `js/config.js`.

## Como visualizar

Abra `index.html` diretamente no navegador, ou sirva a pasta com um servidor local:

```bash
npx serve .
# ou
python3 -m http.server
```

## Dados configurados

- Telefone e WhatsApp: (15) 99116-7340
- E-mail: eduatdo.oliveira222220@gmail.com
- Instagram: @wmgabiao
- Atendimento: 24 horas, em todo o Brasil
- Indicadores: +25 obras, +25 projetos e +6 profissionais
- Imagens reais aplicadas nas seções de serviços, obras e apresentação
- Logo oficial e novo favicon configurados

## Banco de dados e área administrativa

O formulário de orçamento salva as solicitações na tabela `solicitacoes` do Supabase. O painel em `admin.html` permite fazer login, buscar solicitações, filtrar por status, marcar como atendida/pendente e excluir registros.

O site também lê, se existirem, as tabelas `site_content`, `services` e `projects` para sobrescrever textos, contatos, indicadores, serviços e obras. Sem elas (ou sem conexão), o conteúdo padrão do `index.html` é exibido.

### Configuração do Supabase

1. Abra o SQL Editor do projeto Supabase.
2. Execute o conteúdo de `supabase/schema.sql` (pode ser executado mais de uma vez; ele também atualiza caminhos antigos de imagens).
3. Em Authentication > Users, crie o usuário administrador com e-mail e senha.
4. Acesse `admin.html` e entre com esse usuário.

A chave usada no frontend (`js/config.js`) é uma chave publicável. Nunca coloque uma chave `service_role` no HTML ou JavaScript.

## Paleta de cores

| Uso | Cor |
|---|---|
| Preto azulado | `#071015` |
| Preto | `#05080A` |
| Branco | `#FFFFFF` |
| Cinza claro | `#F4F5F3` |
| Cinza escuro | `#1B2428` |
| Dourado (destaque) | `#D8A72D` |
| Terroso (secundário) | `#8D6B32` |

## Tipografia

- Títulos: **Manrope** (700/800)
- Texto: **Inter** (400/500/600)

## Recursos incluídos

- Header fixo com fundo transparente no topo e sólido ao rolar
- Menu mobile em painel lateral
- Seções: Hero, Soluções, Obras (com filtro e lightbox), Onde atuamos, Sobre, Diferenciais, Orçamento (formulário validado), Contato, Rodapé
- Botão flutuante do WhatsApp e botão "voltar ao topo"
- Animações leves ao rolar a página (`data-reveal`, respeita `prefers-reduced-motion`)
- Formulário de orçamento com validação em JavaScript puro
- Marcação Schema.org (`GeneralContractor`) para SEO
- 100% responsivo (mobile, tablet e desktop)
