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

Os dados são armazenados no banco de dados Supabase, possibilitando a consulta e o gerenciamento das ocorrências cadastradas.

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

**Observação:** a disponibilidade dessas funcionalidades depende dos arquivos e da versão efetivamente publicados no repositório.

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

| Tecnologia | Finalidade |
|---|---|
| HTML5 | Estrutura das páginas da aplicação |
| CSS3 | Estilização e organização visual da interface |
| JavaScript | Funcionalidades e interatividade |
| Supabase | Banco de dados e autenticação |
| Chart.js | Criação de gráficos e indicadores |
| Git | Controle de versão do código |
| GitHub | Hospedagem e gerenciamento do repositório |

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
- Acesso aos arquivos do projeto.
- Configuração do projeto no Supabase para utilizar os recursos que dependem do banco de dados.

> 🚧 **Em desenvolvimento**

As instruções de instalação e execução serão adicionadas após a definição da stack tecnológica.

---

## 📁 Estrutura do projeto

O projeto Cidade Ativa está organizado em arquivos responsáveis pela interface principal, pelas funcionalidades da aplicação e pelo painel administrativo.

```text
Cidade-Ativa/
├── index.html
├── style.css
├── script.js
├── admin.html
├── package.json
└── README.md
```

### 📄 Descrição dos arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Página principal da aplicação para o registro de ocorrências urbanas. |
| `style.css` | Define os estilos visuais e a organização da interface principal. |
| `script.js` | Implementa as funcionalidades da página principal e a integração com o Supabase. |
| `admin.html` | Página do painel administrativo para consulta e gerenciamento das ocorrências. |
| `package.json` | Arquivo de configuração e dependências do projeto, quando aplicável. |
| `README.md` | Documentação do projeto, com informações sobre seus objetivos, tecnologias e funcionalidades. |



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
