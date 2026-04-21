// frontend/script.js
const API_URL = '/api'; // Para desenvolvimento local, use 'http://localhost:8000/api'

let selectedFiles = [];

// Elementos DOM
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('files');
const fileList = document.getElementById('fileList');
const processarBtn = document.getElementById('processarBtn');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const resultMessage = document.getElementById('resultMessage');
const downloadBtn = document.getElementById('downloadBtn');

let excelBlob = null;

// Eventos de Drag & Drop
dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
});
dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
});
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

function handleFiles(files) {
    const validFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.pdf') || ext.endsWith('.sor') || ext.endsWith('.msor');
    });
    
    selectedFiles.push(...validFiles);
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="remove-file" data-index="${index}">✕</span>
        `;
        fileList.appendChild(fileItem);
    });
    
    // Adicionar evento de remoção
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            selectedFiles.splice(index, 1);
            updateFileList();
        });
    });
}

processarBtn.addEventListener('click', async () => {
    const operador = document.getElementById('operador').value.trim();
    const comprimento = document.getElementById('comprimento').value;
    const nomePasta = document.getElementById('pasta').value.trim();
    
    if (!operador) {
        alert('Por favor, informe o nome do operador');
        return;
    }
    
    if (!comprimento || comprimento <= 0) {
        alert('Por favor, informe um comprimento válido');
        return;
    }
    
    if (!nomePasta) {
        alert('Por favor, informe o nome da pasta/bobina');
        return;
    }
    
    if (selectedFiles.length === 0) {
        alert('Por favor, selecione pelo menos um arquivo PDF');
        return;
    }
    
    await processarArquivos(operador, parseFloat(comprimento), nomePasta);
});

async function processarArquivos(operador, comprimento, nomePasta) {
    // Mostrar progresso
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    processarBtn.disabled = true;
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });
    formData.append('operador', operador);
    formData.append('comprimento_bobina', comprimento);
    formData.append('nome_pasta', nomePasta);
    
    try {
        progressStatus.textContent = 'Enviando arquivos para processamento...';
        progressBar.style.width = '30%';
        
        const response = await fetch(`${API_URL}/processar`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro no processamento');
        }
        
        progressStatus.textContent = 'Processando PDFs...';
        progressBar.style.width = '70%';
        
        excelBlob = await response.blob();
        
        progressStatus.textContent = 'Planilha gerada com sucesso!';
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            progressSection.style.display = 'none';
            resultSection.style.display = 'block';
            resultMessage.textContent = `Foram processados ${selectedFiles.length} arquivo(s) da pasta "${nomePasta}". Sua planilha está pronta para download.`;
            processarBtn.disabled = false;
        }, 500);
        
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao processar: ${error.message}`);
        progressSection.style.display = 'none';
        processarBtn.disabled = false;
    }
}

downloadBtn.addEventListener('click', () => {
    if (excelBlob) {
        const url = window.URL.createObjectURL(excelBlob);
        const a = document.createElement('a');
        a.href = url;
        const nomePasta = document.getElementById('pasta').value.trim();
        a.download = `BOBINA_${nomePasta}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
});