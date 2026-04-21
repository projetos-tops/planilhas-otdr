# backend/api/index.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Dict
import os
import tempfile
import shutil
from pathlib import Path

from ..core.pdf_parser import PDFParserUniversal
from ..core.excel_handler import ExcelHandler

app = FastAPI(title="Pré-Lançamento System API", version="3.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instâncias dos handlers
pdf_parser = PDFParserUniversal()
excel_handler = ExcelHandler()

@app.get("/")
async def root():
    return {"message": "Pré-Lançamento System API", "version": "3.0.0"}

@app.post("/processar")
async def processar_arquivos(
    files: List[UploadFile] = File(...),
    comprimento_bobina: float = Form(...),
    operador: str = Form(...),
    nome_pasta: str = Form(...)
):
    """
    Processa múltiplos arquivos PDF e retorna um Excel
    """
    try:
        # Validar arquivos
        if not files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
        
        # Processar cada arquivo
        dados_fibras = []
        
        for file in files:
            # Validar extensão
            if not any(file.filename.lower().endswith(ext) for ext in ['.pdf', '.sor', '.msor']):
                continue
            
            # Ler conteúdo do arquivo
            content = await file.read()
            
            # Extrair dados
            dados = await pdf_parser.extrair_dados(content, file.filename)
            dados_fibras.append(dados)
        
        if not dados_fibras:
            raise HTTPException(status_code=400, detail="Nenhum arquivo PDF válido encontrado")
        
        # Carregar template do Excel (usando um template padrão)
        # Para produção, você deve ter um arquivo template real
        template_path = Path(__file__).parent.parent / "template" / "modelo.xlsx"
        
        if not template_path.exists():
            # Criar template básico se não existir
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            template_content = io.BytesIO()
            wb.save(template_content)
            template_content.seek(0)
            modelo_content = template_content.getvalue()
        else:
            with open(template_path, "rb") as f:
                modelo_content = f.read()
        
        # Gerar planilha
        excel_content = await excel_handler.criar_planilha(
            dados_fibras,
            modelo_content,
            nome_pasta,
            comprimento_bobina,
            operador
        )
        
        # Retornar o arquivo Excel
        return StreamingResponse(
            io.BytesIO(excel_content),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=BOBINA_{nome_pasta}.xlsx"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/processar-pasta")
async def processar_pasta(
    files: List[UploadFile] = File(...),
    comprimento_bobina: float = Form(...),
    operador: str = Form(...),
    nome_pasta: str = Form(...)
):
    """
    Processa múltiplos arquivos de uma pasta e retorna um Excel
    """
    return await processar_arquivos(files, comprimento_bobina, operador, nome_pasta)

import io