# backend/core/constants.py
class PosicoesExcel:
    BOBINA = "A8"
    DATA = "E8"
    METRAGEM_TOTAL = "G11"
    LOTE = "G10"
    TIPO = "C9"
    OPERADOR = "A67"
    COMENTARIO = "A63"
    INICIO_DECLIVES = 15

class Config:
    VERSAO = "3.0"
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'.pdf', '.sor', '.msor'}