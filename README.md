# Pré-Lançamento System 🚀

Sistema web para processamento automático de PDFs e geração de planilhas Excel padronizadas.

## ✨ Funcionalidades

- 📄 Processa múltiplos PDFs simultaneamente
- 🔍 Extrai automaticamente dados como distância, declive e data
- 📊 Gera planilhas Excel no formato padrão
- 🌙 Interface moderna com tema dark
- ⚡ Processamento rápido e eficiente

## 🛠️ Tecnologias

- **Backend**: FastAPI, Python
- **Frontend**: HTML5, CSS3, JavaScript
- **Processamento**: pdfplumber, openpyxl
- **Deploy**: Vercel

## 🚀 Como usar

1. Acesse a aplicação online (link do Vercel)
2. Preencha os dados do operador
3. Informe o comprimento da bobina
4. Selecione os arquivos PDF
5. Clique em "Processar Arquivos"
6. Baixe a planilha gerada

## 📦 Instalação local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pre-lancamento-system.git

# Entre no diretório
cd pre-lancamento-system

# Instale as dependências
pip install -r backend/requirements.txt

# Execute o servidor
uvicorn backend.api.index:app --reload

# Acesse http://localhost:8000