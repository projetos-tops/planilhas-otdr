// frontend/script.js
let pastaSelecionada = null;
let arquivosPorPasta = new Map();

// Elementos DOM
const selectPastaBtn = document.getElementById('selectPastaBtn');
const pastaInfo = document.getElementById('pastaInfo');
const processarBtn = document.getElementById('processarBtn');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const resultMessage = document.getElementById('resultMessage');
const downloadBtn = document.getElementById('downloadBtn');
const subpastasList = document.getElementById('subpastasList');

let excelBlobs = [];
let zipBlob = null;

// Selecionar PASTA PRINCIPAL (não arquivos)
selectPastaBtn.addEventListener('click', async () => {
    // Usar input de diretório (funciona em navegadores modernos)
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.directory = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        await organizarPorPastas(files);
    };
    
    input.click();
});

async function organizarPorPastas(files) {
    arquivosPorPasta.clear();
    
    for (const file of files) {
        // Extrair caminho da pasta
        const relativePath = file.webkitRelativePath;
        const partes = relativePath.split('/');
        const nomePasta = partes[0]; // Primeira pasta após a raiz
        
        if (!arquivosPorPasta.has(nomePasta)) {
            arquivosPorPasta.set(nomePasta, []);
        }
        
        // Filtrar apenas PDFs
        if (file.name.toLowerCase().endsWith('.pdf') || 
            file.name.toLowerCase().endsWith('.sor') || 
            file.name.toLowerCase().endsWith('.msor')) {
            arquivosPorPasta.get(nomePasta).push(file);
        }
    }
    
    // Atualizar interface
    atualizarListaPastas();
    pastaSelecionada = true;
    pastaInfo.textContent = `📁 ${arquivosPorPasta.size} pasta(s) encontrada(s)`;
}

function atualizarListaPastas() {
    subpastasList.innerHTML = '';
    
    for (const [nomePasta, arquivos] of arquivosPorPasta) {
        const pastaCard = document.createElement('div');
        pastaCard.className = 'pasta-card';
        pastaCard.innerHTML = `
            <div class="pasta-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <strong>${nomePasta}</strong>
                <span class="arquivos-count">${arquivos.length} arquivo(s)</span>
            </div>
            <div class="arquivos-list">
                ${arquivos.map(f => `<div class="arquivo-item">📄 ${f.name}</div>`).join('')}
            </div>
        `;
        subpastasList.appendChild(pastaCard);
    }
}

processarBtn.addEventListener('click', async () => {
    if (!pastaSelecionada || arquivosPorPasta.size === 0) {
        alert('Por favor, selecione uma pasta principal primeiro');
        return;
    }
    
    const operador = document.getElementById('operador').value.trim();
    const comprimento = document.getElementById('comprimento').value;
    
    if (!operador) {
        alert('Informe o nome do operador');
        return;
    }
    
    if (!comprimento || comprimento <= 0) {
        alert('Informe um comprimento válido');
        return;
    }
    
    await processarMultiplasPastas(operador, parseFloat(comprimento));
});

async function processarMultiplasPastas(operador, comprimento) {
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    processarBtn.disabled = true;
    
    excelBlobs = [];
    const totalPastas = arquivosPorPasta.size;
    let pastasProcessadas = 0;
    
    for (const [nomePasta, arquivos] of arquivosPorPasta) {
        progressStatus.textContent = `Processando pasta: ${nomePasta} (${pastasProcessadas + 1}/${totalPastas})`;
        progressBar.style.width = `${(pastasProcessadas / totalPastas) * 100}%`;
        
        const formData = new FormData();
        arquivos.forEach(file => {
            formData.append('files', file);
        });
        formData.append('operador', operador);
        formData.append('comprimento_bobina', comprimento);
        formData.append('nome_pasta_principal', nomePasta);
        
        try {
            const response = await fetch('/api/processar-pasta', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const blob = await response.blob();
                excelBlobs.push({
                    nome: `BOBINA_${nomePasta}.xlsx`,
                    blob: blob
                });
            }
        } catch (error) {
            console.error(`Erro ao processar ${nomePasta}:`, error);
        }
        
        pastasProcessadas++;
    }
    
    progressBar.style.width = '100%';
    progressStatus.textContent = 'Processamento concluído!';
    
    setTimeout(() => {
        progressSection.style.display = 'none';
        resultSection.style.display = 'block';
        resultMessage.textContent = `${excelBlobs.length} planilha(s) gerada(s) com sucesso!`;
        processarBtn.disabled = false;
    }, 500);
}

downloadBtn.addEventListener('click', async () => {
    if (excelBlobs.length === 1) {
        // Apenas um arquivo: baixar diretamente
        const url = URL.createObjectURL(excelBlobs[0].blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = excelBlobs[0].nome;
        a.click();
        URL.revokeObjectURL(url);
    } else if (excelBlobs.length > 1) {
        // Múltiplos arquivos: criar ZIP
        const JSZip = window.JSZip;
        const zip = new JSZip();
        
        for (const excel of excelBlobs) {
            zip.file(excel.nome, excel.blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'planilhas_geradas.zip';
        a.click();
        URL.revokeObjectURL(url);
    }
});