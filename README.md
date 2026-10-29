# 🏙️ Cidade Ativa

> **Problemas da cidade, soluções mais ativas.**

O **Cidade Ativa** é uma aplicação web desenvolvida com o objetivo de aproximar cidadãos e órgãos públicos, facilitando o registro e o acompanhamento de problemas urbanos de forma simples, organizada e transparente.

## 📋 Sobre o projeto

Problemas como buracos nas ruas, iluminação pública deficiente, descarte irregular de lixo e sinalização danificada fazem parte do cotidiano das cidades.

O Cidade Ativa propõe uma solução digital para centralizar o registro dessas ocorrências, permitindo que os cidadãos informem os problemas encontrados e que os responsáveis acompanhem seu andamento.

### 💡 Como funciona?

O usuário pode registrar uma ocorrência informando:

- 📍 **Localização:** identificação do local do problema no mapa.
- 📝 **Descrição:** informações sobre a situação encontrada.
- 🏷️ **Categoria:** classificação do tipo de ocorrência.
- 🔄 **Status:** acompanhamento do andamento da solicitação.

Os dados são armazenados no banco de dados, possibilitando a consulta e o gerenciamento das ocorrências cadastradas.

## 🎯 Objetivos

### 👤 Para o cidadão

- Registrar problemas urbanos.
- Informar a localização da ocorrência.
- Descrever a situação encontrada.
- Visualizar ocorrências cadastradas no mapa.
- Facilitar o acompanhamento das solicitações.

### 🏛️ Para a administração pública

- Centralizar o registro das ocorrências.
- Consultar problemas cadastrados.
- Visualizar a distribuição das ocorrências.
- Atualizar o status das solicitações.
- Utilizar indicadores para auxiliar na análise das demandas.

## ⚙️ Funcionalidades

### Cadastro de ocorrências

O usuário pode informar a categoria, a descrição e a localização do problema. Após o envio, os dados são armazenados na tabela `ocorrencias` do Supabase.

### Visualização no mapa

A aplicação permite trabalhar com a localização geográfica das ocorrências, facilitando a identificação dos locais que precisam de atenção.

### Painel administrativo

O projeto conta com desenvolvimento de recursos administrativos para consultar e gerenciar os registros, incluindo:

- Listagem e pesquisa de ocorrências.
- Filtros por status.
- Atualização do status dos registros.
- Indicadores e gráficos estatísticos.
- Exportação dos dados em CSV.

Os gráficos e a exportação CSV respeitam os filtros aplicados (status, categoria e busca). O arquivo CSV usa `;` como separador e abre direto no Excel em português.

## 🔄 Fluxo da aplicação

```text
👤 Cidadão
     |
     v
📝 Cadastro da ocorrência
     |
     v
📍 Informações do local
     |
     v
🗄️ Armazenamento no Supabase
     |
     v
🗺️ Consulta das ocorrências
     |
     v
🏛️ Gerenciamento administrativo
     |
     v
🔄 Atualização do status
     |
     v
✅ Acompanhamento da resolução
```

## 🛠️ Tecnologias utilizadas

O projeto Cidade Ativa será desenvolvido utilizando as seguintes tecnologias:

HTML5: responsável pela estruturação das páginas da aplicação.

CSS3: utilizado para a estilização das páginas, cores, layouts e responsividade.

JavaScript: responsável pelas funcionalidades, interações e manipulação dos dados da aplicação.

Supabase: banco de dados PostgreSQL, autenticação de usuários e armazenamento das fotos.

Leaflet + OpenStreetMap: mapa das ocorrências e busca de endereços.

Chart.js: gráficos do painel da prefeitura.


## 📈 Relatórios e indicadores

O painel administrativo possui recursos para apoiar a análise das ocorrências, como:

- Distribuição dos registros por status.
- Distribuição das ocorrências por categoria.
- Quantidade de registros por mês.
- Exportação de dados para análise externa.

Esses recursos ajudam a organizar as informações e podem contribuir para a identificação de demandas prioritárias.

## 🚀 Como executar o projeto

### Pré-requisitos

- Navegador atualizado, como Google Chrome ou Microsoft Edge.
- Um projeto no [Supabase](https://supabase.com) (o plano gratuito é suficiente).
- [VS Code](https://code.visualstudio.com/) com a extensão **Live Server** (ou outro servidor local).

### 1. Configurar o banco de dados (uma única vez)

1. No painel do Supabase, abra **SQL Editor → New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   Isso cria as tabelas `perfis`, `ocorrencias` e `historico`, as regras de segurança (RLS) e o bucket `fotos`.
3. Em **Authentication → Sign In / Providers → Email**, decida sobre **Confirm email**:
   - ligado: o cidadão precisa clicar no link enviado por e-mail antes de entrar;
   - desligado: a conta pode ser usada na hora (mais prático para testes e apresentação).
4. Em **Authentication → URL Configuration**, coloque em **Site URL** o endereço onde o site roda (ex.: `http://127.0.0.1:5500`).

### 2. Ligar o site ao Supabase

O arquivo [`js/config.js`](js/config.js) guarda a **Project URL** e a **publishable key** (em *Project Settings → API Keys*).
Essa chave pode ficar no código; a proteção dos dados é feita pelas regras RLS.
**Nunca** coloque a chave `secret`/`service_role` no projeto.

### 3. Executar

Abra a pasta no VS Code, clique com o botão direito em `index.html` → **Open with Live Server**.
(Abrir o arquivo com duplo clique não funciona bem: o login e o GPS precisam de um endereço `http://`.)

### 4. Criar a conta da prefeitura

Todo cadastro feito pelo site é de **cidadão**. Para criar um acesso da prefeitura:

1. Cadastre a conta normalmente pela tela inicial.
2. No **SQL Editor**, execute (trocando o e-mail):

```sql
update public.perfis set perfil = 'prefeitura'
where id = (select id from auth.users where email = 'email-da-prefeitura@exemplo.com');
```

3. Entre pela aba **Prefeitura**.

### 🗄️ Estrutura do banco

| Tabela        | Conteúdo                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| `perfis`      | Nome e tipo de cada usuário (`cidadao` ou `prefeitura`)                  |
| `ocorrencias` | Categoria, descrição, status, endereço, latitude/longitude e link da foto |
| `historico`   | Linha do tempo de cada ocorrência (status, mensagem, responsável, data)  |

As fotos ficam no bucket `fotos` do Supabase Storage. Pelas regras de segurança, o cidadão só vê as próprias ocorrências,
a prefeitura vê todas, e somente a prefeitura pode alterar o status (função `atualizar_status`).

---

## 📁 Estrutura do projeto

O projeto Cidade Ativa está organizado em arquivos HTML e pastas específicas para os estilos visuais e as funcionalidades JavaScript. Essa organização facilita a manutenção do código e permite separar as interfaces destinadas aos cidadãos e à administração pública.

```text
Cidade-Ativa/
├── .github/
│   └── workflows/  # Configurações de automação do GitHub
├── css/            # Arquivos de estilização (CSS)
├── js/             # Arquivos de funcionalidades (JavaScript)
├── supabase/
│   └── schema.sql  # Script do banco de dados (tabelas, segurança e fotos)
├── README.md       # Documentação do projeto
├── cidadao.html    # Interface destinada aos cidadãos
├── index.html      # Página inicial da aplicação
└── prefeitura.html # Interface destinada à prefeitura
```

### 📄 Descrição dos arquivos e pastas

- **`.github/workflows/`:** armazena arquivos de configuração para automações do GitHub Actions.
- **`css/`:** reúne os arquivos CSS responsáveis pela aparência visual, cores, layouts e responsividade das páginas.
- **`js/`:** contém os arquivos JavaScript responsáveis pelas interações e funcionalidades da aplicação. O `config.js` guarda a conexão com o Supabase e o `comum.js` concentra o acesso ao banco.
- **`supabase/schema.sql`:** script que cria as tabelas, as regras de segurança e o armazenamento de fotos no Supabase.
- **`README.md`:** apresenta a descrição do projeto, seus objetivos, as tecnologias utilizadas e a organização dos códigos.
- **`cidadao.html`:** página destinada aos cidadãos, para acesso às funcionalidades relacionadas ao registro e à consulta de ocorrências.
- **`index.html`:** página inicial da aplicação, utilizada como ponto de entrada para a navegação.
- **`prefeitura.html`:** página destinada à administração pública, voltada à consulta e ao gerenciamento das ocorrências.

A separação dos arquivos HTML, CSS e JavaScript contribui para uma estrutura mais organizada, facilitando futuras atualizações e a implementação de novas funcionalidades.

## 🌱 Impacto esperado

O Cidade Ativa busca contribuir para a transformação digital da gestão urbana, tornando o registro de problemas mais organizado e facilitando o acompanhamento das demandas da população.

A proposta é utilizar a tecnologia para aproximar cidadãos e administração pública, promovendo transparência, organização e eficiência na gestão das ocorrências.

## 👥 Equipe

| Nome                             |     RA |
| -------------------------------- | -----: |
| **Carlos Eduardo Fernandes**     | 264642 |
| **Eduardo Duarte Minutti Filho** | 248116 |
| **Kaike Rafael Figueiredo**      | 248984 |
| **Larissa Trombini**             | 248448 |
| **Leonardo da Silva Faustino**   | 249211 |

---


<div align="center">

### 🏙️ Cidade Ativa

**Problemas da cidade, soluções mais ativas.**

📍 Registre • 🗺️ Acompanhe • 🤝 Transforme

</div>
