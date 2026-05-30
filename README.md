# Landing Page Modular

Estrutura básica de landing page com foco em conversão.

## Como editar

Cada seção da página está em um arquivo separado dentro da pasta `sections/`.

- `sections/header.html`
- `sections/hero.html`
- `sections/trust-strip.html`
- `sections/problem.html`
- `sections/benefits.html`
- `sections/how-it-works.html`
- `sections/features.html`
- `sections/social-proof.html`
- `sections/case-preview.html`
- `sections/comparison.html`
- `sections/pricing-preview.html`
- `sections/lead-qualifier.html`
- `sections/faq.html`
- `sections/final-cta.html`
- `sections/footer.html`

A estrutura geral fica em `index.html`.

## Como rodar localmente

Como as seções são carregadas via `fetch`, rode com um servidor local:

```bash
python -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

## Pastas

```text
landing-page-skeleton/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── include-sections.js
│   └── main.js
├── sections/
│   └── arquivos HTML de cada seção
└── assets/
    ├── img/
    └── icons/
```
