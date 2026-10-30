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

### Visão geral (cidadão)

Na aba **Visão geral**, o cidadão vê todas as ocorrências da cidade, agrupadas por status (Recebida, Em análise, Em andamento e Resolvida),
com busca por nome de quem registrou, endereço ou descrição (sem diferenciar acentos e maiúsculas). As ocorrências do próprio usuário aparecem marcadas como **Sua**.

### Visualização no mapa

A aplicação permite trabalhar com a localização geográfica das ocorrências, facilitando a identificação dos locais que precisam de atenção.

### Painel administrativo

O projeto conta com desenvolvimento de recursos administrativos para consultar e gerenciar os registros, incluindo:

- Listagem e pesquisa de ocorrências.
- Filtros por status.
- Atualização do status dos registros.
- Indicadores e gráficos estatísticos.
- Exportação dos dados em CSV.

### Contas da prefeitura e administradores

Não existe cadastro público de prefeitura. A **conta mestre** (criada pelo script `03-conta-mestre.sql`) e os demais **administradores**
usam o botão **Equipe**, no topo do painel, para:

- cadastrar novas contas da prefeitura, definindo se cada uma é administradora;
- dar ou tirar o acesso de administrador;
- remover o acesso da prefeitura (a conta continua existindo como cidadão).

Ninguém altera o próprio acesso, e a conta mestre não pode ser alterada pelo site.

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
2. Rode os scripts da pasta `supabase/`, **nesta ordem** (cole o conteúdo de cada um e clique em **Run**):
   1. [`01-estrutura.sql`](supabase/01-estrutura.sql): cria as tabelas `perfis`, `ocorrencias` e `historico`, as regras de segurança (RLS) e o bucket `fotos`.
      **Atenção:** apaga os dados existentes; rode só na primeira instalação.
   2. [`02-contas-e-visao-geral.sql`](supabase/02-contas-e-visao-geral.sql): administradores, conta mestre e visão geral. Não apaga dados.
   3. [`03-conta-mestre.sql`](supabase/03-conta-mestre.sql): **troque o e-mail e a senha** antes de rodar. Cria a conta mestre da prefeitura.
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

### 4. Contas da prefeitura

Todo cadastro feito pela tela inicial é de **cidadão**. Para a prefeitura:

1. Entre pela aba **Prefeitura** com a conta mestre (e-mail e senha definidos no `03-conta-mestre.sql`).
2. Clique em **Equipe** e cadastre as contas da equipe, marcando **Administrador** para quem também poderá cadastrar contas.
3. Cada pessoa entra pela aba **Prefeitura** com o e-mail e a senha inicial cadastrados.

### 🗄️ Estrutura do banco

| Tabela        | Conteúdo                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| `perfis`      | Nome, e-mail e tipo de cada usuário (`cidadao` ou `prefeitura`), além de `admin` e `mestre` |
| `ocorrencias` | Categoria, descrição, status, endereço, latitude/longitude e link da foto |
| `historico`   | Linha do tempo de cada ocorrência (status, mensagem, responsável, data)  |

As fotos ficam no bucket `fotos` do Supabase Storage. Pelas regras de segurança, todo usuário logado pode ver as ocorrências
(visão geral), cada cidadão só registra em seu próprio nome, somente a prefeitura altera o status (função `atualizar_status`)
e somente administradores gerenciam a equipe (`criar_conta_prefeitura`, `definir_admin`, `remover_acesso_prefeitura`).

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
│   ├── 01-estrutura.sql            # Tabelas, segurança e fotos
│   ├── 02-contas-e-visao-geral.sql # Administradores e visão geral
│   └── 03-conta-mestre.sql         # Criação da conta mestre
├── README.md       # Documentação do projeto
├── cidadao.html    # Interface destinada aos cidadãos
├── index.html      # Página inicial da aplicação
└── prefeitura.html # Interface destinada à prefeitura
```

### 📄 Descrição dos arquivos e pastas

- **`.github/workflows/`:** armazena arquivos de configuração para automações do GitHub Actions.
- **`css/`:** reúne os arquivos CSS responsáveis pela aparência visual, cores, layouts e responsividade das páginas.
- **`js/`:** contém os arquivos JavaScript responsáveis pelas interações e funcionalidades da aplicação. O `config.js` guarda a conexão com o Supabase e o `comum.js` concentra o acesso ao banco.
- **`supabase/`:** scripts SQL do banco, para rodar em ordem no SQL Editor do Supabase (estrutura, contas/visão geral e conta mestre).
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
