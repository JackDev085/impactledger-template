# 🎓 SkillChain - Verifiable Educational Credentials

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://hackweb-skillchain.vercel.app/)
[![Ethereum Sepolia](https://img.shields.io/badge/Ethereum-Sepolia_Testnet-blue?style=flat&logo=ethereum)](https://sepolia.etherscan.io/address/0x2351562952afb48bf847C96065531e724658Da2F)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**SkillChain** é uma plataforma Web3 descentralizada projetada para emissão, armazenamento e verificação pública de certificados educacionais e diplomas acadêmicos. 

Utilizando a rede de testes **Ethereum Sepolia**, a plataforma atesta a autenticidade e integridade dos documentos escolares de forma imutável e transparente, combatendo fraudes de currículo e simplificando o processo de validação por recrutadores e departamentos de Recursos Humanos.

---

## 💡 O Propósito: Por que SkillChain?

1. **Combate a Fraudes Acadêmicas:** De acordo com pesquisas de mercado, uma porcentagem significativa de currículos contém diplomas falsos ou cargas horárias infladas. O SkillChain impede isso registrando a impressão digital única (hash criptográfico) do certificado diretamente na blockchain.
2. **Eliminação de Burocracia:** Processos tradicionais de validação de diplomas exigem contato direto com cartórios ou com as secretarias das universidades. Com a SkillChain, a verificação é instantânea, pública e criptograficamente auditável por qualquer pessoa.
3. **Soberania do Estudante:** O estudante passa a ter um portfólio digital seguro contendo todas as suas certificações verificadas de diferentes instituições em um só lugar.

---

## 🛠️ Funcionalidades Principais

* **Portal Multiusuário (Roles):**
  * **Admin Máximo (Autoridade Governamental/MEC):** Responsável por aprovar ou rejeitar instituições de ensino na rede para garantir que apenas entidades legítimas emitam diplomas.
  * **Instituições de Ensino (Universidades/Escolas):** Cadastram cursos, gerenciam cargas horárias e emitem certificados vinculados às carteiras dos alunos.
  * **Estudantes:** Acessam seus painéis e visualizam seus certificados acumulados de forma organizada.
* **Emissão Híbrida (Web2 + Web3):**
  * Suporta gravação direta de transações na blockchain Sepolia via MetaMask.
  * Mantém um banco de dados ágil no backend que armazena os metadados do curso e do aluno.
* **Validação Pública Instantânea:**
  * Qualquer recrutador ou empresa pode acessar a página de verificação sem login.
  * O sistema consulta o contrato inteligente e atesta se o emissor era autorizado e se o hash confere com o registrado em blockchain.

---

## ⚙️ Arquitetura Tecnológica

O projeto é estruturado em um monorepo dividido em duas partes principais:

* **Frontend (React + Vite):**
  * **Estilização:** Tailwind CSS v4 para uma interface moderna, minimalista e responsiva em tons de azul escuro e cinza.
  * **Animações:** Framer Motion para transições de página e feedbacks de carregamento fluidos.
  * **Web3 Integration:** Ethers.js v6 para comunicação direta com a MetaMask e leitura de contratos na rede Sepolia.
* **Backend (Node.js + Express):**
  * Banco de dados JSON leve e auto-semeável (seeding automatizado para facilidade em apresentações).
  * Adaptado para rodar sob **Vercel Serverless Functions**, utilizando o diretório temporário `/tmp` para gravação de novos cadastros em tempo real.
* **Contratos Inteligentes (Solidity + Hardhat):**
  * Contrato `SkillChain.sol` contendo a governança de aprovação de instituições e a emissão e revogação de certificados.
  * Compilado e testado usando a suíte Hardhat.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (v18 ou superior)
* Extensão da carteira MetaMask instalada no navegador (caso queira testar a integração com a Blockchain)

### 1. Clonando o Repositório e Configurando o Backend
Entre na pasta do backend, instale as dependências e configure o arquivo `.env`:

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/` seguindo o modelo:
```env
PORT=5000
JWT_SECRET=sua_chave_secreta_jwt
ALCHEMY_API_KEY=sua_api_key_do_alchemy_ou_infura
SEPOLIA_PRIVATE_KEY=sua_chave_privada_da_carteira_sepolia
```

Inicie o servidor de desenvolvimento do backend:
```bash
npm run dev
```
O servidor estará rodando em `http://localhost:5000`.

### 2. Configurando o Frontend
Abra um novo terminal na raiz do projeto, navegue até a pasta do frontend e instale as dependências:

```bash
cd frontend
npm install
```

Inicie o servidor de desenvolvimento do frontend:
```bash
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

---

## ⛓️ Informações de Deploy (Produção)

### Smart Contract (Sepolia Testnet)
O contrato inteligente foi implantado no seguinte endereço:
* **Contrato:** `0x2351562952afb48bf847C96065531e724658Da2F`
* **Explorador:** [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x2351562952afb48bf847C96065531e724658Da2F)

### Hospedagem (Vercel)
O frontend e o backend estão rodando de forma unificada sob o mesmo link na Vercel:
* **URL:** [https://hackweb-skillchain.vercel.app/](https://hackweb-skillchain.vercel.app/)

---

## 🔑 Dados para Apresentação (Demo)

Para testar a aplicação sem precisar criar dados do zero, utilize as contas pré-carregadas descritas no arquivo [dados_demo.txt](./dados_demo.txt):

* **Admin Master:** `admin@skillchain.org` / `adminpassword`
* **Instituição de Ensino:** `mit@edu.org` / `mitpassword`
* **Estudante:** `john@doe.com` / `johnpassword`
* **ID para Validação Pública:** `2jwr91084` (digite este ID na barra de busca de verificação para testar a resposta do banco de dados).

---
## Equipe

- Jackson Lorran do Nascimento