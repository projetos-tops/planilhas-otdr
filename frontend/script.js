// frontend/script.js
let pastasEncontradas = new Map(); // nome da pasta -> arquivos
let planilhasGeradas = [];

// Elementos
const selectPastaBtn = document.getElementById('selectPastaBtn');
const pastaInfo = document.getElementById('pastaInfo');
const pastasList = document.getElementById('pastasList');
const processarBtn = document.getElementById('processarBtn');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const resultMessage = document.getElementById('resultMessage');
const downloadBtn = document.getElementById('downloadBtn');

// Selecionar pasta principal
selectPastaBtn.addEventListener('click', () => {
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
    pastasEncontradas.clear();
    
    for (const file of files) {
        const relativePath = file.webkitRelativePath;
        const nomePasta = relativePath.split('/')[0];
        
        if (!pastasEncontradas.has(nomePasta)) {
            pastasEncontradas.set(nomePasta, []);
        }
        
        // Só adicionar PDFs
        if (file.name.toLowerCase().endsWith('.pdf') || 
            file.name.toLowerCase().endsWith('.sor') || 
            file.name.toLowerCase().endsWith('.msor')) {
            pastasEncontradas.get(nomePasta).push(file);
        }
    }
    
    // Atualizar interface - mostra SÓ AS PASTAS
    atualizarListaPastas();
    pastaInfo.textContent = `📁 ${pastasEncontradas.size} pasta(s) encontrada(s)`;
}

function atualizarListaPastas() {
    pastasList.innerHTML = '';
    
    for (const [nomePasta, arquivos] of pastasEncontradas) {
        const pastaDiv = document.createElement('div');
        pastaDiv.className = 'pasta-item';
        pastaDiv.innerHTML = `
            <span>📁 ${nomePasta}</span>
            <span class="badge">${arquivos.length} arquivos</span>
        `;
        pastasList.appendChild(pastaDiv);
    }
}

// Processar todas as pastas
processarBtn.addEventListener('click', async () => {
    const operador = document.getElementById('operador').value.trim();
    const comprimento = document.getElementById('comprimento').value;
    
    if (!operador) {
        alert('Informe o nome do operador');
        return;
    }
    
    if (!comprimento || comprimento <= 0) {
        alert('Informe o comprimento da bobina');
        return;
    }
    
    if (pastasEncontradas.size === 0) {
        alert('Selecione uma pasta principal primeiro');
        return;
    }
    
    await processarTodasPastas(operador, parseFloat(comprimento));
});

async function processarTodasPastas(operador, comprimento) {
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    processarBtn.disabled = true;
    
    planilhasGeradas = [];
    const totalPastas = pastasEncontradas.size;
    let processadas = 0;
    
    for (const [nomePasta, arquivos] of pastasEncontradas) {
        progressStatus.textContent = `Processando: ${nomePasta} (${processadas + 1}/${totalPastas})`;
        progressBar.style.width = `${(processadas / totalPastas) * 100}%`;
        
        const formData = new FormData();
        arquivos.forEach(file => {
            formData.append('files', file);
        });
        formData.append('operador', operador);
        formData.append('comprimento_bobina', comprimento);
        formData.append('nome_pasta', nomePasta);
        
        try {
            const response = await fetch('/api/processar-pasta', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const blob = await response.blob();
                planilhasGeradas.push({
                    nome: `BOBINA_${nomePasta}.xlsx`,
                    blob: blob
                });
            }
        } catch (error) {
            console.error(`Erro em ${nomePasta}:`, error);
        }
        
        processadas++;
        progressBar.style.width = `${(processadas / totalPastas) * 100}%`;
    }
    
    progressStatus.textContent = 'Concluído!';
    progressBar.style.width = '100%';
    
    setTimeout(() => {
        progressSection.style.display = 'none';
        resultSection.style.display = 'block';
        resultMessage.textContent = `${planilhasGeradas.length} planilha(s) gerada(s)`;
        processarBtn.disabled = false;
    }, 500);
}

// Download
downloadBtn.addEventListener('click', async () => {
    if (planilhasGeradas.length === 1) {
        const url = URL.createObjectURL(planilhasGeradas[0].blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = planilhasGeradas[0].nome;
        a.click();
        URL.revokeObjectURL(url);
    } else if (planilhasGeradas.length > 1) {
        const zip = new JSZip();
        for (const planilha of planilhasGeradas) {
            zip.file(planilha.nome, planilha.blob);
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