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
