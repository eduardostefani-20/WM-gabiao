# WM Gabião — Site institucional

Site institucional estático (HTML5, CSS3 e JavaScript puro, sem frameworks) para a **WM Gabião & Construção LTDA**.

## Estrutura

```
/wm-gabiao
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── logo/
├── admin.html
├── supabase/
│   └── schema.sql
└── README.md
```

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

O formulário salva as solicitações no Supabase. O painel administrativo está em `admin.html` e permite fazer login, editar textos, contatos, indicadores e imagens por URL, cadastrar serviços e obras, publicar/ocultar itens, além de buscar solicitações, filtrar por status, marcar como atendida e excluir registros.

### Configuração do Supabase

1. Abra o SQL Editor do projeto Supabase.
2. Execute o conteúdo de `supabase/schema.sql`.
3. Em Authentication > Users, crie o usuário administrador com e-mail e senha.
4. Acesse `admin.html` e entre com esse usuário.
5. No painel, use as abas **Conteúdo do site** e **Serviços e obras** para atualizar o site. As alterações aparecem no site público após recarregar a página.

6. O painel permite escolher fotos ou vídeos diretamente do computador. O arquivo é enviado para o bucket `site-media` e a URL é salva automaticamente. O limite é de 25 MB por arquivo.

Também é possível colar uma URL pública. Não use uma chave `service_role` no frontend.

A chave usada no frontend é uma chave publicável. Nunca coloque uma chave `service_role` no HTML ou JavaScript.

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
