# Duck Scroll 3D POC

Prova de conceito de um elemento 3D para site usando Three.js.

## O que tem no projeto

- Modelo OBJ do pato em `assets/models/duck.obj`
- Material amarelo estilo borracha fosca
- Textura procedural de borracha via `CanvasTexture`
- Iluminação de estúdio
- Rotação do pato controlada pelo scroll da página
- Estrutura simples para subir em um repositório

## Como rodar localmente

```bash
npm install
npm run dev
```

Depois, abra a URL indicada pelo Vite no navegador.

## Observação

Não abra o `index.html` direto pelo navegador, porque o carregamento do OBJ precisa de servidor local.
Use Vite, Live Server ou outro servidor estático.
