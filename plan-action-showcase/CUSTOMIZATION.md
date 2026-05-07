# Guia de Customização - Plan-Action Showcase

Este documento fornece instruções detalhadas para customizar o showcase de acordo com suas necessidades.

## 📝 Índice

1. [Alterar Cores e Temas](#alterar-cores-e-temas)
2. [Modificar Conteúdo](#modificar-conteúdo)
3. [Adicionar Novas Seções](#adicionar-novas-seções)
4. [Integrar Formulários](#integrar-formulários)
5. [Otimizar para SEO](#otimizar-para-seo)
6. [Deploying](#deploying)

---

## 🎨 Alterar Cores e Temas

### Opção 1: Modificar Variáveis CSS

Abra `css/styles.css` e localize a seção `:root`:

```css
:root {
    /* Altere estas cores */
    --primary-blue: #003d82;    /* Cor principal */
    --secondary-blue: #0055b8;  /* Cor secundária */
    --tertiary-blue: #0073e6;   /* Cor terciária */
    
    /* Use cores do seu branding */
    --primary-blue: #1e40af;    /* Exemplo: azul mais claro */
    --white: #ffffff;           /* Branco mantido */
}
```

### Opção 2: Usar Temas Pré-definidos

**Tema Verde (Tech):**
```css
--primary-blue: #059669;
--secondary-blue: #10b981;
--tertiary-blue: #34d399;
```

**Tema Roxo (Premium):**
```css
--primary-blue: #6b21a8;
--secondary-blue: #7e22ce;
--tertiary-blue: #a855f7;
```

**Tema Laranja (Energético):**
```css
--primary-blue: #ea580c;
--secondary-blue: #fb923c;
--tertiary-blue: #fdba74;
```

---

## 📝 Modificar Conteúdo

### 1. Alterar Logo e Textos

**Logo:**
```html
<!-- Em index.html, linha 20 -->
<div class="logo">
    <span class="logo-icon">📋</span>  <!-- Mude o emoji ou adicione uma imagem -->
    <span class="logo-text">Plan-Action</span>  <!-- Mude o texto -->
</div>
```

### 2. Personalizar Hero Section

```html
<!-- index.html, linhas ~50-65 -->
<h1 class="hero-title">Seu Título Aqui</h1>
<p class="hero-subtitle">Sua descrição aqui com o valor único do produto</p>
```

### 3. Adicionar/Remover Features

Para adicionar uma feature:

```html
<!-- Adicione este card na seção features -->
<div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Seu Recurso</h3>
    <p>Descrição do recurso aqui.</p>
</div>
```

Para remover, simplesmente delete o `<div class="feature-card">` completo.

### 4. Modificar Planos de Preço

```html
<!-- Localizar e editar em index.html -->
<div class="pricing-card">
    <h3>Seu Plano</h3>
    <p class="price"><span class="currency">R$</span><span class="amount">99</span></p>
    <p class="price-desc">/mês • Faturamento anual</p>
    <ul class="features-list">
        <li>✓ Feature 1</li>
        <li>✓ Feature 2</li>
        <li>✓ Feature 3</li>
    </ul>
    <button class="btn btn-primary">CTA Button</button>
</div>
```

---

## ➕ Adicionar Novas Seções

### Estrutura Básica de Seção

```html
<!-- Adicione antes de </main> ou antes de </body> -->
<section class="minha-nova-secao" id="minha-secao">
    <div class="container">
        <h2 class="section-title">Título da Seção</h2>
        <p class="section-subtitle">Subtítulo descritivo</p>
        
        <!-- Seu conteúdo aqui -->
    </div>
</section>
```

### Adicionar Estilo CSS

Em `css/styles.css`, adicione:

```css
.minha-nova-secao {
    padding: var(--spacing-2xl) 0;
    background: var(--white);
}

.minha-nova-secao h3 {
    color: var(--primary-blue);
}
```

### Adicionar ao Menu de Navegação

Em `index.html`, adicione no navbar:

```html
<li><a href="#minha-secao">Meu Item</a></li>
```

---

## 📋 Integrar Formulários

### Exemplo: Formulário de Contato

```html
<section class="contact-form">
    <div class="container">
        <h2 class="section-title">Entre em Contato</h2>
        
        <form id="contact-form">
            <div class="form-group">
                <label for="name">Nome</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="message">Mensagem</label>
                <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">Enviar</button>
        </form>
    </div>
</section>
```

### Ativar Validação em JS

Em `js/script.js`, descomente:

```javascript
window.PlanActionUtils.setupFormValidation('#contact-form');
```

### Integrar com Backend

Modifique o arquivo `js/script.js`:

```javascript
function setupFormValidation(formSelector) {
    const form = document.querySelector(formSelector);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        // Enviar para seu backend
        const response = await fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            alert('Mensagem enviada com sucesso!');
            form.reset();
        }
    });
}
```

---

## 🔍 Otimizar para SEO

### 1. Meta Tags

Em `index.html`, customize:

```html
<head>
    <meta name="description" content="Sua descrição SEO aqui (160 caracteres)">
    <meta name="keywords" content="palavra-chave1, palavra-chave2">
    <meta name="author" content="Seu Nome">
    <meta property="og:title" content="Seu Título">
    <meta property="og:description" content="Descrição para redes sociais">
    <meta property="og:image" content="URL da imagem">
    <title>Seu Título | Plan-Action</title>
</head>
```

### 2. Estrutura de Headings

Manter ordem hierárquica:
- H1: Um por página (titulo principal)
- H2: Títulos de seções
- H3: Subtítulos

### 3. Alt Text em Imagens

```html
<img src="imagem.jpg" alt="Descrição descritiva da imagem">
```

### 4. URLs Amigáveis

Se adicionando seções, use IDs descritivos:

```html
<section id="recursos-principais">
    <!-- Conteúdo -->
</section>
```

### 5. Schema Markup

Adicione antes de `</head>`:

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Plan-Action",
    "description": "Plataforma de gestão de planos de ação",
    "applicationCategory": "ProductivityApplication"
}
</script>
```

---

## 🚀 Deploying

### GitHub Pages

1. Crie um repositório no GitHub
2. Ative GitHub Pages nas configurações
3. Faça push dos arquivos para `main`

### Netlify

```bash
# 1. Instale Netlify CLI
npm install -g netlify-cli

# 2. Deploy
netlify deploy --prod --dir=.
```

### Vercel

```bash
# 1. Instale Vercel CLI
npm install -g vercel

# 2. Deploy
vercel
```

### Servidor Tradicional

1. Faça upload dos arquivos via FTP/SFTP
2. Configure o domínio
3. Teste em navegadores

---

## 🎯 Dicas de Performance

### 1. Minificar CSS e JS

```bash
# CSS
cat css/styles.css css/animations.css > css/bundle.min.css
# (Use um minifier para reduzir ainda mais)

# JavaScript
# Use ferramentas como terser.js
```

### 2. Comprimir Imagens

```bash
# Use ferramentas como ImageOptim ou TinyPNG
```

### 3. Lazy Load de Imagens

```html
<img src="placeholder.jpg" data-src="image.jpg" alt="Descrição">
<!-- Script já suporta lazy loading automático -->
```

### 4. Cache Headers

Configure no seu servidor:

```
# .htaccess (Apache)
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

---

## 📱 Testes

### Responsividade

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: até 767px

Use DevTools do navegador (F12) para testar.

### Cross-browser

Teste em:
- Chrome
- Firefox
- Safari
- Edge

### Performance

Use Google PageSpeed Insights:
https://pagespeed.web.dev/

---

## 🐛 Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| Cores não mudam | Limpe cache (Ctrl+Shift+R ou Cmd+Shift+R) |
| Animações lentas | Desative prefers-reduced-motion |
| Links não funcionam | Verifique IDs das seções |
| Mobile quebrado | Teste viewport em DevTools |
| Formulário não envia | Configure backend corretamente |

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique o console do navegador (F12)
2. Consulte a documentação MDN
3. Teste em navegador diferente
4. Verifique sintaxe HTML/CSS/JS

---

**Divirta-se customizando! 🎉**
