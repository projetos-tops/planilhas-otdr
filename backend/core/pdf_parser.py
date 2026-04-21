# backend/core/pdf_parser.py
import re
import pdfplumber
from typing import Dict, List
import io

class PDFParserUniversal:
    @staticmethod
    async def extrair_dados(pdf_content: bytes, filename: str) -> Dict:
        """Extrai dados do PDF a partir do conteúdo em bytes"""
        dados = {
            "data": "",
            "distancia_final": 0.0,
            "declive": 0.0,
            "tipo": "",
            "fibra": 0
        }
        
        try:
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                texto_completo = ""
                for page in pdf.pages:
                    texto_completo += page.extract_text() + "\n"
            
            # Buscar Data
            data_match = re.search(r'Data\s*:\s*(\d{2}/\d{2}/\d{4})', texto_completo)
            if data_match:
                dados["data"] = data_match.group(1)
            
            # Buscar Distância Final
            distancias = re.findall(r'(\d+\.\d+)\s*m', texto_completo)
            if distancias:
                dados["distancia_final"] = max([float(d) for d in distancias])
            
            # Buscar Declive
            linhas = texto_completo.split('\n')
            for i, linha in enumerate(linhas):
                if 'Declive' in linha and 'dB/km' in linha:
                    for j in range(i+1, min(i+5, len(linhas))):
                        numeros = re.findall(r'-?\d+\.?\d*', linhas[j])
                        if len(numeros) >= 5:
                            dados["declive"] = float(numeros[4])
                            break
                    break
            
            if dados["declive"] == 0:
                declive_match = re.search(r'Declive\s+([\d\.]+)', texto_completo)
                if declive_match:
                    dados["declive"] = float(declive_match.group(1))
            
            # Buscar número da fibra
            fibra_match = re.search(r'F[-_]?(\d+)', filename, re.I)
            if fibra_match:
                dados["fibra"] = int(fibra_match.group(1))
            
            # Buscar Tipo
            tipo_match = re.search(r'ID da Fibra /Número\s*:\s*Fiber\s*(\d+)', texto_completo, re.I)
            if tipo_match:
                dados["tipo"] = f"Fibra {tipo_match.group(1)}"
                
        except Exception as e:
            print(f"Erro ao processar PDF: {e}")
        
        return dados