# Plan-Action 📋

> **Plataforma Inteligente de Gestão de Planos de Ação**

[![Status: Ativo](https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-005DB3?style=flat&logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)]()
[![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=java&logoColor=white)]()

### 👨‍💻 Desenvolvedores
<a href="https://github.com/L03sch"><img src="https://github.com/L03sch.png" width="40" height="40" style="border-radius:50%" alt="brunoL" title="L03sch" /></a>
<a href="https://github.com/FR4NC0-11"><img src="https://github.com/FR4NC0-11.png" width="40" height="40" style="border-radius:50%" alt="jeanfranco" title="FR4NC0-11" /></a>
<a href="https://github.com/Vhs0808"><img src="https://github.com/Vhs0808.png" width="40" height="40" style="border-radius:50%" alt="vitorH" title="Vhs0808" /></a>
<a href="https://github.com/ViniS4rtor"><img src="https://github.com/ViniS4rtor.png" width="40" height="40" style="border-radius:50%" alt="vinisartor" title="ViniS4rtor" /></a>

### 🧑‍🏫 Tutores
<a href="https://github.com/marcioscbnu"><img src="https://github.com/marcioscbnu.png" width="40" height="40" style="border-radius:50%" alt="marcio" title="marcioscbnu" /></a>

---

## 📖 Sobre o Projeto

**Plan-Action** é uma **solução educacional completa** desenvolvida por **4 alunos** da **Escola SESI Senai Blumenau** como trabalho final de curso, oferecendo uma **plataforma moderna e intuitiva para gestão de planos de ação** com acesso gratuito para toda a instituição.

### 🎯 Objetivo

Criar uma ferramenta prática que permite gestores e equipes:
- 📊 Organizar e acompanhar planos de ação
- 📅 Gerenciar cronogramas e prazos
- 👥 Colaborar em tempo real
- 📈 Acompanhar o progresso e resultados
- 🔔 Receber notificações de tarefas importantes

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido em **3 componentes principais**:

### 1️⃣ Frontend - React (Aplicação Principal)
📁 **Pasta:** `sesisenaiaction-hub-main/`

Aplicação web moderna e responsiva para o gerenciamento de planos de ação.

**Stack Tecnológico:**
- ⚛️ **React 18+** - Biblioteca UI
- 📘 **TypeScript** - Tipagem estática
- 🚀 **Vite** - Build tool e dev server
- 🎨 **Tailwind CSS** - Framework de estilos utilitários
- 📦 **shadcn/ui** - Componentes acessíveis e personalizáveis
- 🗄️ **Supabase** - Backend e banco de dados
- 🔄 **React Query** - Gerenciamento de estado e cache de requisições
- 📡 **Radix UI** - Primitivos de UI acessíveis

**Recursos:**
- ✅ Autenticação segura com Supabase
- ✅ Dashboard intuitivo
- ✅ Gestão de planos de ação
- ✅ Painel de usuários
- ✅ Suporte e configurações
- ✅ Design responsivo (mobile-first)
- ✅ Tema claro/escuro
- ✅ Acessibilidade web (WCAG compliant)

---

### 2️⃣ Landing Page - HTML/CSS/JS
📁 **Pasta:** `plan-action-showcase/`

Página de apresentação e showcase da plataforma Plan-Action, totalmente responsiva e otimizada para conversão.

**Stack Tecnológico:**
- 🏷️ **HTML5** - Markup semântico
- 🎨 **CSS3** - Flexbox, Grid, Custom Properties
- 🖱️ **JavaScript Vanilla** - Interatividade sem dependências
- 📱 **Responsive Design** - Mobile-first approach

**Seções:**
- Hero section com CTA
- Features/Recursos
- Como funciona
- Pricing (3 planos)
- Testimonials/Depoimentos
- FAQ
- Footer com links

**Características:**
- ✨ Animações suaves e fluidas
- 🎯 SEO-friendly
- ⚡ Performance otimizada
- ♿ Acessível (navegação por teclado)
- 📱 100% responsivo

---

### 3️⃣ Backend - Spring Boot (Java)
📁 **Pasta:** `demo/`

Servidor backend e API REST para processamento de dados e lógica de negócio.

**Stack Tecnológico:**
- ☕ **Spring Boot 3.5.7** - Framework Java
- 📦 **Maven** - Gerenciador de dependências
- ☕ **Java 21** - Linguagem
- 🗄️ **[Banco de Dados configurado]** - Persistência

**Funcionalidades:**
- API REST para gerenciamento
- Autenticação e autorização
- Processamento de dados
- Integração com banco de dados

---

## 🚀 Como Iniciar

### Pré-requisitos

Certifique-se de ter instalado:

- 📦 **Node.js 18+** (para frontend)
- 🔧 **npm ou yarn** (gerenciador de pacotes)
- ☕ **Java 21+** (para backend)
- 📦 **Maven 3.8+** (para compilação Java)
- 🔌 **Git** (controle de versão)

### Instalação Rápida

#### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/sesisenaiaction-hub.git
cd sesisenaiaction-hub
```

#### 2. Configurar Frontend React

```bash
cd sesisenaiaction-hub-main

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

#### 3. Configurar Landing Page

```bash
cd plan-action-showcase

# Opção 1: Abrir diretamente no navegador
open index.html

# Opção 2: Usando Python (servidor local)
python -m http.server 8000
# Acesse: http://localhost:8000

# Opção 3: Usando Node.js
npx http-server -p 3000
```

#### 4. Configurar Backend Spring Boot

```bash
cd demo

# Compilar o projeto
mvn clean package

# Executar a aplicação
mvn spring-boot:run
```

O backend estará disponível em: **http://localhost:8080**

---

## 📁 Estrutura do Projeto

```
sesisenaiaction-hub/
│
├── 📁 sesisenaiaction-hub-main/          # Aplicação React Principal
│   ├── src/
│   │   ├── components/                   # Componentes React
│   │   ├── pages/                        # Páginas da aplicação
│   │   ├── hooks/                        # Custom hooks
│   │   ├── lib/                          # Utilitários
│   │   ├── integrations/                 # Integrações externas (Supabase)
│   │   ├── App.tsx                       # Componente raiz
│   │   └── main.tsx                      # Entry point
│   ├── supabase/                         # Configuração Supabase
│   │   └── migrations/                   # Migrações do banco de dados
│   ├── public/                           # Arquivos estáticos
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── README.md
│
├── 📁 plan-action-showcase/              # Landing Page
│   ├── index.html                        # Página principal
│   ├── css/
│   │   ├── styles.css                    # Estilos principais
│   │   └── animations.css                # Animações
│   ├── js/
│   │   └── script.js                     # Interatividade
│   ├── assets/
│   │   └── images/                       # Imagens
│   ├── README.md
│   ├── QUICK_START.md
│   ├── CONFIG.md
│   └── ...outros documentos
│
├── 📁 demo/                              # Backend Spring Boot
│   ├── src/
│   │   ├── main/java/com/                # Código fonte
│   │   └── resources/                    # Recursos (properties)
│   ├── pom.xml                           # Configuração Maven
│   ├── mvnw                              # Maven wrapper (Unix)
│   ├── mvnw.cmd                          # Maven wrapper (Windows)
│   └── README.md
│
└── README.md                             # Este arquivo!
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **React** | 18+ | Biblioteca UI |
| **TypeScript** | 5+ | Tipagem estática |
| **Vite** | 5+ | Build tool |
| **Tailwind CSS** | 3+ | Estilização |
| **shadcn/ui** | Latest | Componentes UI |
| **Supabase** | 2+ | Backend & DB |
| **React Query** | 5+ | Gerenciamento de estado |
| **Radix UI** | Latest | UI Primitives |

### Backend

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Spring Boot** | 3.5.7 | Framework |
| **Java** | 21+ | Linguagem |
| **Maven** | 3.8+ | Gerenciador de dependências |

### Ferramentas de Desenvolvimento

- 🔧 **Git & GitHub** - Controle de versão
- 📝 **VS Code** - Editor de código
- 🎨 **Figma** - Design (UI/UX)
- 🧪 **ESLint** - Linting JavaScript/TypeScript
- 📦 **npm** - Gerenciador de pacotes

---

## 🏫 Contexto Educacional

### 🎓 Sobre a Escola SESI Senai Blumenau

A **Escola SESI Senai Blumenau** é uma instituição de educação profissional localizada em Blumenau, Santa Catarina, que oferece cursos técnicos e profissionalizantes na área de tecnologia e indústria.

### 📚 Objetivos de Aprendizado

Este projeto foi desenvolvido com foco em consolidar conhecimentos em:

#### **Técnicos**
- ✅ Desenvolvimento Web Full-Stack
- ✅ Frontend moderno (React, TypeScript)
- ✅ Backend com Spring Boot
- ✅ Banco de dados relacional
- ✅ Responsive Design e Acessibilidade
- ✅ Versionamento com Git
- ✅ Deployment e DevOps

#### **Gestão de Projetos**
- ✅ Planejamento e escopo
- ✅ Estimativa de tarefas
- ✅ Cronograma e milestones
- ✅ Qualidade e testes
- ✅ Documentação

#### **Profissionais**
- ✅ Trabalho em equipe
- ✅ Comunicação efetiva
- ✅ Resolução de problemas
- ✅ Responsabilidade profissional
- ✅ Comprometimento com qualidade

---

## 👨‍💻 Equipe de Desenvolvimento

Este projeto foi desenvolvido por **4 talentosos alunos** da Escola SESI Senai Blumenau em colaboração com seus orientadores.

### Papéis e Responsabilidades

| Função | Responsabilidades |
|--------|------------------|
| **Frontend Developer** | Interface, componentes, responsividade |
| **Backend Developer** | APIs, lógica de negócio, database |
| **UI/UX Designer** | Design visual, prototipagem, acessibilidade |
| **Project Manager** | Coordenação, cronograma, documentação |

> Para detalhes específicos dos desenvolvedores, consulte [DEVELOPERS.md](plan-action-showcase/DEVELOPERS.md)

---

## 📖 Documentação

Documentação detalhada disponível em:

- **[QUICK_START.md](plan-action-showcase/QUICK_START.md)** - Guia rápido para começar
- **[DEVELOPERS.md](plan-action-showcase/DEVELOPERS.md)** - Informações da equipe
- **[PROJECT_INFO.md](plan-action-showcase/PROJECT_INFO.md)** - Detalhes do projeto
- **[CONFIG.md](plan-action-showcase/CONFIG.md)** - Configurações disponíveis
- **[CUSTOMIZATION.md](plan-action-showcase/CUSTOMIZATION.md)** - Guia de personalização
- **[DEPLOYMENT_CHECKLIST.md](plan-action-showcase/DEPLOYMENT_CHECKLIST.md)** - Checklist para deploy

---

## 🎨 Design e UX

### Paleta de Cores

```css
--primary-blue: #003d82       /* Azul forte - Primário */
--secondary-blue: #0055b8     /* Azul médio - Secundário */
--tertiary-blue: #0073e6      /* Azul claro - Terciário */
--light-blue: #e3f2fd         /* Azul claro - Fundo */
--pale-blue: #f0f7ff          /* Azul pálido - Backgrounds */
--white: #ffffff              /* Branco - Principal */
--text-dark: #1a1a1a          /* Cinza escuro - Texto */
--text-light: #666666         /* Cinza - Texto secundário */
```

### Tipografia

- **Font Stack:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Tamanho Base:** 16px
- **Altura de Linha:** 1.6

### Responsividade

- 📱 **Mobile:** < 640px
- 📱 **Tablet:** 640px - 1024px
- 🖥️ **Desktop:** > 1024px

---

## 🔐 Segurança & Privacidade

- 🔒 Autenticação segura via Supabase
- 🛡️ Autorização baseada em roles
- 🔐 Criptografia de dados sensíveis
- 📋 Conformidade com LGPD (Lei Geral de Proteção de Dados)
- ♿ Acessibilidade WCAG 2.1 AA

---

## 📊 Como o Projeto Foi Desenvolvido

### 📅 Ciclo de Desenvolvimento

1. **Análise e Planejamento**
   - Definição de escopo e requisitos
   - Prototipagem e mockups
   - Estimativa de esforço

2. **Design**
   - Wireframes em alta fidelidade
   - Design visual e sistema de cores
   - Prototipagem interativa

3. **Desenvolvimento Frontend**
   - Setup do projeto React/TypeScript
   - Componentização
   - Integração com Supabase
   - Testes e otimização

4. **Desenvolvimento Backend**
   - Setup Spring Boot
   - APIs REST
   - Integração com banco de dados
   - Autenticação e autorização

5. **Testes e QA**
   - Testes unitários
   - Testes de integração
   - Testes de usabilidade
   - Testes de performance

6. **Deployment e Publicação**
   - Deploy em produção
   - Monitoramento
   - Documentação final

### 🔄 Metodologia

- **Agile/Scrum** - Sprints de 2 semanas
- **Pair Programming** - Revisão contínua de código
- **Code Review** - Qualidade e aprendizado
- **Continuous Improvement** - Retrospectivas regulares

### 📈 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Duração Total** | ~3-4 meses |
| **Linhas de Código** | ~15,000+ |
| **Commits** | 100+ |
| **Arquivos** | 200+ |
| **Componentes** | 50+ |
| **Horas de Trabalho** | 500+ |

---

## 🚀 Deploy

### Opções de Hospedagem

#### Frontend (React)

**Vercel** (Recomendado)
```bash
npm run build
# Deploy automático via GitHub
```

**Netlify**
```bash
npm run build
# Arrastar pasta dist
```

**AWS Amplify**
```bash
amplify publish
```

#### Backend (Spring Boot)

**AWS Elastic Beanstalk**
```bash
eb create plan-action-env
eb deploy
```

**Heroku**
```bash
git push heroku main
```

**DigitalOcean App Platform**
- Conectar repositório GitHub
- Configurar variáveis de ambiente
- Deploy automático

---

## 🤝 Contribuindo

Quer contribuir para o projeto? Siga estes passos:

1. **Faça um Fork** do repositório
2. **Crie uma Branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **Push para a Branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Padrões de Código

- Use **TypeScript** para tipagem forte
- Siga **ESLint** rules configuradas
- Escreva **testes** para novas features
- Adicione **comentários** quando necessário
- Mantenha **commits pequenos e atômicos**

---

## 📝 Licença

Este projeto está licenciado sob a [MIT License](LICENSE) - veja o arquivo LICENSE para detalhes.

---

## 📞 Suporte & Contato

### Reportar Bugs

Encontrou um bug? Abra uma [Issue](https://github.com/seu-usuario/sesisenaiaction-hub/issues) com:
- Descrição do problema
- Passos para reproduzir
- Screenshots/vídeos (se aplicável)
- Seu ambiente (OS, navegador, versões)

### Sugestões de Melhorias

Tem uma ideia legal? Crie uma [Discussion](https://github.com/seu-usuario/sesisenaiaction-hub/discussions)!

### Contato

- 📧 **Email:** contato@plan-action.com
- 📱 **Website:** [plan-action.com](https://plan-action.com)
- 💬 **Discord/Slack:** [Link do servidor]

---

## 🎯 Roadmap Futuro

- [ ] Aplicativo mobile (React Native)
- [ ] Integração com calendários (Google Calendar, Outlook)
- [ ] Relatórios avançados em PDF/Excel
- [ ] Notificações em tempo real (Web Push)
- [ ] Integração com Slack/Teams
- [ ] AI-powered insights e recomendações
- [ ] Sistema de templates personalizados
- [ ] Multi-idioma (i18n)
- [ ] Dark mode completo
- [ ] Melhorias de performance

---

## 📚 Recursos Adicionais

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [Spring Boot Guide](https://spring.io/guides/gs/spring-boot/)

---

## 📜 Changelog

### v1.0.0 (2025-05)
- ✅ Lançamento inicial
- ✅ Autenticação e gestão de usuários
- ✅ CRUD de planos de ação
- ✅ Dashboard com estatísticas
- ✅ Landing page completa

### v0.9.0 (2025-04)
- 🔧 Versão beta
- 🔧 Testes e ajustes finais

---

## 🙏 Agradecimentos

Agradecemos a:
- 👨‍🏫 **Professores da Escola SESI Senai Blumenau** pela orientação
- 🏫 **Instituição SESI** pelo apoio e oportunidade
- 💪 **Comunidade Open Source** pelas ferramentas e bibliotecas utilizadas
- 👥 **Toda a equipe** pelo empenho e dedicação

---

## 📄 Informações Adicionais

- **Autor(es):** Desenvolvido por 4 alunos da Escola SESI Senai Blumenau
- **Localização:** Blumenau, Santa Catarina, Brasil
- **Ano de Desenvolvimento:** 2025
- **Público-alvo:** Gestores educacionais e equipes de trabalho
- **Status:** ✅ Ativo e em desenvolvimento contínuo

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma star! ⭐**

Desenvolvido com ❤️ por alunos da Escola SESI Senai Blumenau

[Site](https://plan-action.com) • [Issues](https://github.com/seu-usuario/sesisenaiaction-hub/issues) • [Discussions](https://github.com/seu-usuario/sesisenaiaction-hub/discussions)

</div>
