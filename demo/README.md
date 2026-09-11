# Plan-Action Spring Boot Backend

## 📋 Overview

Backend Spring Boot 3.5.7 para o sistema Plan-Action, com suporte completo a autenticação JWT, CRUD de planos de ação e gerenciamento de usuários.

## 🏗️ Arquitetura

### Estrutura de Packages

```
com.senai.demo/
├── config/              # Configurações (JWT, Security, CORS)
├── entity/              # Entidades JPA
├── dto/                 # Data Transfer Objects (Request/Response)
├── repository/          # Interfaces JpaRepository
├── service/             # Lógica de negócio
├── controller/          # Endpoints REST
├── security/            # Componentes de segurança (JWT, UserDetails)
├── exception/           # Tratamento de exceções
└── util/                # Utilitários (Password encoding)
```

## 🗄️ Entidades

### Profile
- Usuários do sistema (admin, professor, manager, user)
- Email único
- Password hash com BCrypt
- Soft delete com `deleted_at`

### ActionPlan
- Planos de ação com status (planning, in_progress, completed, cancelled)
- Prioridade (low, medium, high, critical)
- Relacionamento com Profile (criador)

### PlanAssignment
- Atribuição de planos a professores
- Relacionamento muitos-para-muitos através PlanAssignment

## 🔐 Segurança

### Autenticação JWT
- Secret configurável via `jwt.secret` (application.yml)
- Expiração: 1 hora (configurável)
- Refresh token: 7 dias (configurável)
- Filter: `JwtAuthenticationFilter` intercepta requisições

### Autorização
- Roles: ADMIN, PROFESSOR, MANAGER, USER
- `@PreAuthorize` em endpoints sensíveis
- CORS habilitado para localhost:3000 e localhost:5173

## 📡 API Endpoints

### Auth
```
POST   /api/auth/signup           - Criar conta
POST   /api/auth/login            - Login (retorna JWT)
POST   /api/auth/logout           - Logout
POST   /api/auth/refresh          - Renovar token
GET    /api/auth/me               - Perfil atual
```

### Profiles
```
GET    /api/profiles              - Listar todos (admin)
GET    /api/profiles/{id}         - Detalhes do perfil
PUT    /api/profiles/{id}         - Atualizar perfil
DELETE /api/profiles/{id}         - Apagar perfil (admin)
POST   /api/profiles/{id}/avatar  - Upload avatar
```

### Action Plans
```
GET    /api/action-plans          - Listar planos (com filtro por status)
GET    /api/action-plans/{id}     - Detalhes do plano
POST   /api/action-plans          - Criar plano
PUT    /api/action-plans/{id}     - Atualizar plano
DELETE /api/action-plans/{id}     - Apagar plano
GET    /api/action-plans/stats    - Dashboard stats
```

### Assignments
```
GET    /api/assignments?planId=   - Listar professores de um plano
POST   /api/assignments           - Atribuir professor a plano
DELETE /api/assignments/{id}      - Remover atribuição
```

### Users (Admin)
```
GET    /api/users                 - Listar usuários
DELETE /api/users/{id}            - Apagar usuário
```

## ⚙️ Configuração

### application.yml
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/action_hub
    username: root
    password: 
  jpa:
    hibernate:
      ddl-auto: update

jwt:
  secret: your-secret-key
  expiration: 3600000        # 1 hora
  refresh-expiration: 604800000  # 7 dias
```

### Profiles
- **dev**: `application-dev.yml` (ddl-auto: create-drop)
- **prod**: `application.yml` (ddl-auto: update)

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- MySQL 8.0+
- Maven 3.8+

### Setup
```bash
# 1. Clone o repositório
git clone ...

# 2. Configure MySQL
mysql -u root -p
CREATE DATABASE action_hub;

# 3. Configure application.yml
# Edite demo/src/main/resources/application.yml com suas credenciais

# 4. Compile e rode
cd demo
mvn clean install
mvn spring-boot:run

# Servidor rodará em http://localhost:8080
```

### Endpoints de Teste
```bash
# Signup
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "department": "IT"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Usar token
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## 📦 Dependências Principais

- **Spring Boot 3.5.7**: Framework principal
- **Spring Security**: Autenticação e autorização
- **Spring Data JPA**: ORM com Hibernate
- **JJWT 0.12.3**: Geração e validação de JWT
- **MySQL 8**: Banco de dados
- **Lombok**: Redução de boilerplate
- **Jakarta Validation**: Validação de DTOs

## 🔄 Fluxo de Autenticação

1. **Signup**: POST `/api/auth/signup` → Cria perfil + retorna JWT
2. **Login**: POST `/api/auth/login` → Valida credenciais + retorna JWT
3. **Requisições**: Header `Authorization: Bearer {token}`
4. **Filter**: `JwtAuthenticationFilter` valida token em cada requisição
5. **Context**: Usuario carregado em `SecurityContextHolder`

## ⚠️ Notas Importantes

- Senhas são hashadas com BCrypt
- Soft delete: registros marcados com `deleted_at` em vez de removidos
- Timestamps automáticos: `created_at` e `updated_at` via Hibernate
- UUIDs para IDs em vez de auto-increment
- CORS configurado para localhost (mudar em produção)
- JWT secret deve ser alterado em produção

## 📝 Próximos Passos

- [ ] Configurar banco de dados em produção
- [ ] Integrar com serviço de upload de arquivos (S3, etc)
- [ ] Adicionar testes unitários
- [ ] Implementar rate limiting
- [ ] Configurar CI/CD pipeline
- [ ] Adicionar documentação Swagger/OpenAPI

## 👤 Autor

Copilot CLI
