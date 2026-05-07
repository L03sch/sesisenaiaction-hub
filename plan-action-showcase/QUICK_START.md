# Início Rápido - Plan-Action Showcase

## 🚀 Como Iniciar em 2 Minutos

### 1. Abrir no Navegador

**Opção A: Arquivo Local**
- Abra o arquivo `index.html` diretamente no seu navegador
- Ou arraste o arquivo para uma aba do navegador

**Opção B: Servidor Local (Recomendado)**

#### Windows (PowerShell)
```powershell
python -m http.server 8000
# Navegue para http://localhost:8000
```

#### Mac/Linux (Terminal)
```bash
python3 -m http.server 8000
# Navegue para http://localhost:8000
```

#### Com Node.js
```bash
npx http-server -p 8000
# Navegue para http://localhost:8000
```

### 2. Verificar se Está Funcionando

- ✅ Página carrega sem erros
- ✅ Menu funciona (clique em links)
- ✅ Botões respondem ao hover
- ✅ Seções deslizam suavemente

---

## 🎨 Primeiras Customizações

### Alterar Logo
```html
<!-- Em index.html, linha ~20 -->
<!-- Mude de: -->
<span class="logo-icon">📋</span>
<!-- Para: -->
<span class="logo-icon">🚀</span>
```

### Alterar Título Principal
```html
<!-- Em index.html, linha ~50 -->
Altere: "Controle Total de Seus Planos de Ação"
Para: "Seu Título Aqui"
```

### Alterar Cores Principais
```css
/* Em css/styles.css, linha ~1 */
:root {
    --primary-blue: #003d82;  /* Mude este azul */
}
```

---

## 📁 Estrutura Rápida

```
plan-action-showcase/
├── index.html           ← Edite aqui o conteúdo
├── css/styles.css       ← Edite aqui as cores e layout
├── css/animations.css   ← Efeitos e animações
├── js/script.js         ← Interatividade
└── README.md            ← Documentação completa
```

---

## 🔗 Links das Seções

No menu, as seções são:
- Recursos → `#features`
- Como Funciona → `#how-it-works`
- Planos → `#pricing`
- Depoimentos → `#testimonials`

Para adicionar um novo link:
```html
<li><a href="#sua-secao">Seu Item</a></li>
```

---

## 🎯 Próximas Etapas

1. **Customizar Cores**
   - Edite as variáveis em `css/styles.css`

2. **Adicionar Conteúdo**
   - Modifique textos e imagens em `index.html`

3. **Integrar Formulário**
   - Adicione um formulário de contato
   - Configure backend para receber dados

4. **Deploy**
   - Suba para GitHub Pages, Netlify ou Vercel
   - Configure seu domínio

---

## ✨ Dicas Rápidas

- Use `Ctrl+Shift+R` para limpar cache
- Abra DevTools com `F12` para debugar
- Teste responsividade em `F12 → Toggle device toolbar`
- Verifique console para erros (F12 → Console)

---

## 📞 Ajuda Rápida

| Problema | Solução |
|----------|---------|
| Página branca | Verifique se todos os arquivos CSS/JS foram carregados (F12 → Network) |
| Animações não funcionam | Limpe cache (Ctrl+Shift+R) |
| Mobile não funciona | Verifique viewport no DevTools (F12 → Toggle Device Toolbar) |
| Cores estranhas | Edite variáveis CSS em `css/styles.css` |

---

## 🌐 Deploy em 5 Minutos

### GitHub Pages
1. Crie conta em github.com
2. Crie novo repositório `seu-usuario.github.io`
3. Faça upload dos arquivos
4. Acesse em `seu-usuario.github.io`

### Netlify (Mais Fácil)
1. Acesse netlify.com
2. Arraste a pasta do projeto
3. Pronto! Site online em segundos

### Vercel
1. Acesse vercel.com
2. Import projeto do GitHub
3. Deploy automático a cada push

---

## 📖 Para Aprender Mais

- [CSS-Tricks](https://css-tricks.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Documentação Completa](README.md)
- [Guia de Customização](CUSTOMIZATION.md)

---

## 🎉 Pronto!

Você tem um showcase profissional!

**Próximo passo:** Customize para seu negócio e compartilhe com o mundo! 🚀

---

*Dúvidas? Veja o arquivo README.md para documentação completa.*
