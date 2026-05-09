# SupportHub - Gestão de Suporte Técnico 🛠️

O **SupportHub** é uma plataforma moderna e robusta para gestão de chamados e suporte técnico, desenvolvida para oferecer uma experiência premium tanto para administradores e técnicos quanto para usuários finais.

![Dashboard Preview](screen.png)

## 🚀 Funcionalidades Principais

### 🎫 Gestão de Chamados (Tickets)
*   **Abertura Simplificada:** Interface intuitiva para usuários relatarem problemas com anexos e categorias.
*   **Fluxo de Atendimento:** Controle total de status (Aberto, Em Atendimento, Aguardando Peças, Concluído).
*   **Priorização:** Definição de níveis de urgência (Baixa, Normal, Alta, Urgente).
*   **Atribuição Inteligente:** Vinculação de técnicos específicos a cada chamado.

### 📊 Painel de Controle e Relatórios
*   **Dashboard em Tempo Real:** Cards de resumo com contagem de chamados por status.
*   **Métricas de Desempenho:** Gráficos de distribuição por categoria e volume de atendimento.
*   **Histórico Completo:** Rastreabilidade total desde a criação até o fechamento.

### 👥 Controle de Acesso (RBAC)
*   **Administrador:** Gestão total do sistema, usuários e configurações globais.
*   **Técnico:** Foco no atendimento, alteração de status e gestão de chamados atribuídos.
*   **Cliente:** Abertura e acompanhamento apenas dos seus próprios chamados.

### ⚙️ Personalização e Configurações
*   **White Label:** Customização de logomarca, título do sistema e subtítulos.
*   **Gestão de Usuários:** Cadastro e controle de perfis de acesso.
*   **Central de Ajuda:** Configuração de informações de suporte (E-mail, Site, Telefone).

## 🛠️ Stack Tecnológica

*   **Frontend:** React 18 + TypeScript
*   **Build Tool:** Vite
*   **Estilização:** Tailwind CSS (Design System Moderno)
*   **Backend & DB:** Supabase (PostgreSQL)
*   **Autenticação:** Supabase Auth (Integrado via tabela de usuários)
*   **Ícones:** Google Material Symbols

## 📦 Como Instalar e Rodar

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/Carlos566487/07-Suporte-Tecnico.git
    cd 07-Suporte-Tecnico
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
    ```env
    VITE_SUPABASE_URL=sua-url-do-supabase
    VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
    ```

4.  **Rodar em ambiente de desenvolvimento:**
    ```bash
    npm run dev
    ```

## 📂 Estrutura do Projeto

```text
src/
├── components/
│   ├── auth/          # Login e Autenticação
│   ├── dashboard/     # Tabelas, Relatórios, Configurações
│   └── layout/        # Header, Sidebar e Navegação
├── lib/               # Configuração do Supabase e Types
├── App.tsx            # Orquestrador de Rotas e Estado Global
└── main.tsx           # Ponto de entrada
```

## 🔐 Segurança

O projeto utiliza **Variáveis de Ambiente** para proteger as credenciais do banco de dados e **Políticas de RLS (Row Level Security)** no PostgreSQL para garantir que cada usuário acesse apenas os dados permitidos para seu cargo.

---
Desenvolvido com foco em alta performance e experiência do usuário. 🚀