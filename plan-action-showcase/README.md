# Plan-Action Showcase

Um showcase web moderno e responsivo para o **Plan-Action** - plataforma de gestão inteligente de Planos de Ação.

## � Projeto Educacional

**Plan-Action** é um **projeto educacional** desenvolvido por **4 alunos** da **Escola SESI Senai Blumenau** como trabalho final de curso, com acesso **100% gratuito** para toda a Escola SESI.

> 📌 **Informações Detalhadas:** Veja [ABOUT_SESI.md](ABOUT_SESI.md) para mais informações sobre o SESI e [DEVELOPERS.md](DEVELOPERS.md) para conhecer a equipe de alunos.

- **Design Elegante**: Tema azul forte + branco com visual profissional
- **Responsividade**: Totalmente otimizado para desktop, tablet e mobile
- **Performance**: Carregamento rápido com animações suaves
- **UX Premium**: Interações intuitivas e engajantes
- **Acessibilidade**: Semântica HTML5 correta e suporte a navegação por teclado

## 🎓 Contexto Educacional

Este projeto representa um importante **trabalho colaborativo** que demonstra:

### Objetivos Alcançados
✅ Aplicação prática de conhecimentos de desenvolvimento web  
✅ Resolução de um problema real da Escola SESI  
✅ Trabalho em equipe e gestão de projetos  
✅ Desenvolvimento de competências profissionais  
✅ Inovação em gestão educacional  

### Equipe de Desenvolvimento
- 👨‍💻 **4 Alunos** talentosos da Escola SESI Senai Blumenau
- 🏫 **Orientação**: Professores da Escola SESI
- 🎯 **Objetivo**: Projeto Final do Curso de Desenvolvimento Web

> Para conhecer a equipe, veja **[DEVELOPERS.md](DEVELOPERS.md)**

## 📁 Estrutura do Projeto

```
plan-action-showcase/
├── index.html              # Página principal
├── css/
│   ├── styles.css          # Estilos principais
│   └── animations.css       # Animações e transições
├── js/
│   └── script.js           # Lógica de interatividade
└── assets/
    └── images/             # Pasta para imagens (vazia, pronta para uso)
```

## 🎯 Seções Principais

### 1. **Navegação Fixa**
- Logo interativo do Plan-Action
- Menu de navegação com links suave
- Call-to-action no navbar

### 2. **Hero Section**
- Título chamativo com gradient
- Subtítulo descritivo
- Dois botões de CTA (Teste Grátis e Demo)
- Visual mockup da aplicação

### 3. **Features Section**
- 6 cards de recursos principais
- Ícones descritivos
- Animação de entrada em cascata

### 4. **Como Funciona**
- 4 passos visuais para começar
- Conexão entre etapas
- Explicação simples e direta

### 5. **Pricing**
- 3 planos (Starter, Professional, Enterprise)
- Plano destacado como "Mais Popular"
- Lista de features por plano

### 6. **Testimonials**
- 3 depoimentos de clientes
- Avaliação em estrelas
- Avatar e informações do autor

### 7. **CTA Final**
- Chamada para ação principal
- Estímulo para começar teste grátis

### 8. **Footer**
- Informações sobre o produto
- Links rápidos
- Social media
- Copyright

## 🎨 Paleta de Cores

```css
--primary-blue: #003d82       /* Azul forte */
--secondary-blue: #0055b8     /* Azul secundário */
--tertiary-blue: #0073e6      /* Azul terciário */
--light-blue: #e3f2fd         /* Azul claro */
--pale-blue: #f0f7ff          /* Azul pálido */
--white: #ffffff              /* Branco */
```

## ✨ Funcionalidades

### Animações Incluídas
- ✅ Fade in/out (entrada e saída suave)
- ✅ Slide animations (deslizamento)
- ✅ Scale animations (zoom suave)
- ✅ Parallax effect (efeito de profundidade)
- ✅ Stagger animations (animação em cascata)
- ✅ Gradient animations (gradiente em movimento)

### Interatividades
- ✅ Scroll animado para seções
- ✅ Hover effects nos botões e cards
- ✅ Observador de interseção (Intersection Observer)
- ✅ Barra de progresso de scroll
- ✅ Navegação ativa baseada em scroll
- ✅ Efeito parallax na hero

### Performance
- ✅ CSS otimizado
- ✅ Lazy loading de imagens
- ✅ Suporte a redução de movimento (prefers-reduced-motion)
- ✅ Métricas de performance

## 🚀 Como Usar

### 1. **Localmente**
Simplesmente abra o arquivo `index.html` em um navegador moderno:

```bash
# Ou use um servidor local (recomendado)
python -m http.server 8000
# Navegue para http://localhost:8000
```

### 2. **Personalização**

#### Alterar Cores
Edite as variáveis CSS em `css/styles.css`:

```css
:root {
    --primary-blue: #003d82;    /* Altere para a cor desejada */
    /* ... outras cores ... */
}
```

#### Adicionar Conteúdo
- Edite textos direto no `index.html`
- Adicione novas seções seguindo o mesmo padrão
- Use as classes de animação: `animate-fade-up`, `animate-slide-up`, etc.

#### Integrar com Backend
O arquivo `js/script.js` possui a função `setupFormValidation()` pronta para integração:

```javascript
window.PlanActionUtils.setupFormValidation('#seu-formulario');
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:

- **Desktop**: Acima de 1024px
- **Tablet**: 768px a 1024px
- **Mobile**: Até 768px

## ♿ Acessibilidade

- ✅ Semântica HTML5 correta
- ✅ Navegação por teclado (Tab, Escape)
- ✅ Suporte a leitores de tela
- ✅ Contraste adequado de cores
- ✅ Links descriptivos

## 🔧 Tecnologias Utilizadas

- **HTML5** - Marcação semântica
- **CSS3** - Flexbox, Grid, Custom Properties
- **JavaScript Vanilla** - Sem dependências externas
- **Intersection Observer API** - Para animações em scroll

## 📊 SEO e Meta Tags

O projeto inclui:
- Title otimizado
- Meta description
- Viewport configuration
- Estrutura semântica

## 🎁 Bônus

### Classes CSS Reutilizáveis

```html
<!-- Animações -->
<div class="animate-fade-up">Fade In Up</div>
<div class="animate-slide-up">Slide In Up</div>
<div class="animate-scale-in">Scale In</div>

<!-- Efeitos -->
<div class="animate-pulse">Pulsante</div>
<div class="animate-float">Flutuante</div>
<div class="animate-glow">Brilho</div>
```

### Funções JavaScript Úteis

```javascript
// Animar contador
window.PlanActionUtils.animateCounter(element, 100);

// Validar formulário
window.PlanActionUtils.setupFormValidation('#form');

// Lazy load de imagens
window.PlanActionUtils.setupLazyLoading();

// Copiar para clipboard
window.PlanActionUtils.setupCopyToClipboard('.copy-btn', 'texto');
```

## 🚦 Performance

- Page Load Time: < 2s
- Lighthouse Score: 90+
- Sem dependencies externas
- CSS minificável para produção

## 📝 Customização Avançada

### Adicionar Nova Seção

```html
<section class="minha-secao">
    <div class="container">
        <h2 class="section-title">Meu Título</h2>
        <div class="secao-grid">
            <!-- Conteúdo aqui -->
        </div>
    </div>
</section>
```

### Criar Novo Card

```html
<div class="feature-card">
    <div class="feature-icon">🚀</div>
    <h3>Recurso</h3>
    <p>Descrição</p>
</div>
```

## 🐛 Troubleshooting

### Animações não aparecem
- Verifique se `animations.css` está linkado no HTML
- Confirme se o navegador suporta CSS3 animations
- Desative prefers-reduced-motion nas configurações

### Scroll não funciona
- Limpe o cache do navegador
- Verifique se os IDs das seções correspondem aos links

### Mobile não responsivo
- Use viewport `<meta name="viewport">`
- Teste com DevTools do navegador

## 📚 Referências

- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [Web.dev](https://web.dev/)

## 📄 Licença

MIT License - Sinta-se livre para usar, modificar e distribuir.

## 👨‍💻 Autor

Desenvolvido como um showcase profissional para Plan-Action.

---

**Pronto para colocar seu produto em destaque?** 🚀

Customize, compartilhe e aproveite o showcase!
