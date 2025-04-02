// 儲存所有部件資料
const partsDatabase = {
    background: [],
    body: [],
    head: [],
    accessory: []
};

// DOM 元素
const categorySelect = document.getElementById('category-select');
const imageUpload = document.getElementById('image-upload');
const folderUpload = document.getElementById('folder-upload');
const probabilityInput = document.getElementById('probability');
const probabilityValue = document.getElementById('probability-value');
const optionalToggle = document.getElementById('optional-toggle');
const addPartBtn = document.getElementById('add-part-btn');
const partsList = document.getElementById('parts-list');
const generateBtn = document.getElementById('generate-btn');
const generateCount = document.getElementById('generate-count');
const clearAllBtn = document.getElementById('clear-all-btn');
const resultCanvas = document.getElementById('result-canvas');
const batchResults = document.getElementById('batch-results');
const saveBtn = document.getElementById('save-btn');
const saveAllBtn = document.getElementById('save-all-btn');
const tabButtons = document.querySelectorAll('.tab-btn');

// 初始化畫布
const ctx = resultCanvas.getContext('2d');
clearCanvas();

// 事件監聽器
probabilityInput.addEventListener('input', updateProbabilityValue);
addPartBtn.addEventListener('click', addPart);
folderUpload.addEventListener('change', handleFolderUpload);
generateBtn.addEventListener('click', generateImages);
clearAllBtn.addEventListener('click', clearAllParts);
saveBtn.addEventListener('click', saveCurrentImage);
saveAllBtn.addEventListener('click', saveAllImages);
tabButtons.forEach(btn => btn.addEventListener('click', filterPartsByCategory));

// 更新機率顯示
function updateProbabilityValue() {
    const value = probabilityInput.value;
    probabilityValue.textContent = `${value}%`;
    updateRarityIndicator(value);
}

function updateRarityIndicator(value) {
    const val = parseInt(value);
    probabilityValue.className = '';
    
    if (val <= 10) {
        probabilityValue.classList.add('legendary');
    } else if (val <= 30) {
        probabilityValue.classList.add('rare');
    } else if (val <= 60) {
        probabilityValue.classList.add('uncommon');
    } else {
        probabilityValue.classList.add('common');
    }
}

// 處理資料夾上傳
function handleFolderUpload(e) {
    const files = Array.from(e.target.files);
    const category = categorySelect.value;
    const probability = parseInt(probabilityInput.value);
    const isOptional = optionalToggle.checked;
    
    if (files.length === 0) return;
    
    // 顯示上傳進度
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.textContent = '0%';
    progressContainer.appendChild(progressBar);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'folder-upload-info';
    infoDiv.innerHTML = `正在上傳 ${files.length} 個檔案...`;
    infoDiv.appendChild(progressContainer);
    
    // 插入到上傳按鈕後面
    const uploadSection = document.querySelector('.upload-section');
    uploadSection.insertBefore(infoDiv, uploadSection.children[uploadSection.children.length - 1]);
    
    let processed = 0;
    
    files.forEach((file, index) => {
        if (!file.type.match('image.*')) {
            processed++;
            updateProgress();
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgData = e.target.result;
            const partId = Date.now().toString() + index;
            
            partsDatabase[category].push({
                id: partId,
                category: category,
                imgData: imgData,
                probability: probability,
                name: file.name.replace(/\.[^/.]+$/, ""),
                isOptional: isOptional
            });
            
            processed++;
            updateProgress();
            
            if (processed === files.length) {
                setTimeout(() => {
                    infoDiv.innerHTML = `成功上傳 ${processed} 個圖片檔案！`;
                    setTimeout(() => infoDiv.remove(), 3000);
                    updatePartsList();
                }, 500);
            }
        };
        reader.readAsDataURL(file);
    });
    
    function updateProgress() {
        const percent = Math.round((processed / files.length) * 100);
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
    }
}

// 添加單個部件
function addPart() {
    if (imageUpload.files.length === 0) {
        alert('請先選擇圖片文件');
        return;
    }
    
    const category = categorySelect.value;
    const probability = parseInt(probabilityInput.value);
    const isOptional = optionalToggle.checked;
    const file = imageUpload.files[0];
    
    if (probability < 1 || probability > 100) {
        alert('機率必須在1-100之間');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgData = e.target.result;
        const partId = Date.now().toString();
        
        partsDatabase[category].push({
            id: partId,
            category: category,
            imgData: imgData,
            probability: probability,
            name: file.name.replace(/\.[^/.]+$/, ""),
            isOptional: isOptional
        });
        
        updatePartsList();
        imageUpload.value = '';
    };
    reader.readAsDataURL(file);
}

// 更新部件列表
function updatePartsList() {
    partsList.innerHTML = '';
    
    const activeTab = document.querySelector('.tab-btn.active');
    const activeCategory = activeTab ? activeTab.dataset.category : 'all';
    
    for (const category in partsDatabase) {
        partsDatabase[category].forEach(part => {
            if (activeCategory !== 'all' && part.category !== activeCategory) return;
            
            const partItem = document.createElement('div');
            partItem.className = 'part-item';
            partItem.dataset.id = part.id;
            
            let rarityClass = '';
            if (part.probability <= 10) {
                rarityClass = 'legendary';
            } else if (part.probability <= 30) {
                rarityClass = 'rare';
            } else if (part.probability <= 60) {
                rarityClass = 'uncommon';
            } else {
                rarityClass = 'common';
            }
            
            partItem.innerHTML = `
                <img src="${part.imgData}" class="part-image" alt="${part.name}">
                <div class="part-info">
                    <span class="part-category">${part.category} ${part.isOptional ? '(可選)' : ''}</span>
                    <div class="part-probability ${rarityClass}">${part.probability}%</div>
                    <div class="part-name">${part.name}</div>
                </div>
                <button class="delete-part" data-id="${part.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            partsList.appendChild(partItem);
        });
    }
    
    document.querySelectorAll('.delete-part').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const partId = btn.dataset.id;
            deletePart(partId);
        });
    });
}

// 刪除部件
function deletePart(partId) {
    for (const category in partsDatabase) {
        partsDatabase[category] = partsDatabase[category].filter(part => part.id !== partId);
    }
    updatePartsList();
}

// 清空所有部件
function clearAllParts() {
    if (confirm('確定要刪除所有部件嗎？此操作無法復原！')) {
        for (const category in partsDatabase) {
            partsDatabase[category] = [];
        }
        updatePartsList();
        clearCanvas();
        batchResults.innerHTML = '';
    }
}

// 按分類過濾部件
function filterPartsByCategory(e) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    updatePartsList();
}

// 生成圖片
function generateImages() {
    for (const category in partsDatabase) {
        if (partsDatabase[category].length === 0 && !hasOptionalParts(category)) {
            alert(`請至少上傳一個${category}部件`);
            return;
        }
    }
    
    const count = parseInt(generateCount.value);
    batchResults.innerHTML = '';
    
    generateSingleImage(resultCanvas);
    
    if (count > 1) {
        for (let i = 0; i < count - 1; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 250;
            canvas.height = 250;
            canvas.className = 'batch-canvas';
            
            const container = document.createElement('div');
            container.className = 'batch-result-item';
            container.appendChild(canvas);
            
            batchResults.appendChild(container);
            
            setTimeout(() => {
                generateSingleImage(canvas);
            }, 0);
        }
    }
}

// 檢查類別是否有可選部件
function hasOptionalParts(category) {
    return partsDatabase[category].some(part => part.isOptional);
}

// 生成單張圖片
function generateSingleImage(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = ['background', 'body', 'head', 'accessory'];
    
    categories.forEach(category => {
        // 檢查是否是可選類別且50%機率不顯示
        const optionalParts = partsDatabase[category].filter(part => part.isOptional);
        if (optionalParts.length > 0 && Math.random() < 0.5) {
            return; // 跳過這個類別
        }
        
        const selectedPart = selectPartByProbability(partsDatabase[category]);
        if (selectedPart) {
            drawImageOnCanvas(selectedPart.imgData, canvas);
        }
    });
}

// 根據機率選擇部件
function selectPartByProbability(parts) {
    if (parts.length === 0) return null;
    
    // 只考慮非可選部件或可選但決定要顯示的部件
    const validParts = parts.filter(part => !part.isOptional);
    if (validParts.length === 0) return null;
    
    const totalProbability = validParts.reduce((sum, part) => sum + part.probability, 0);
    let random = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    
    for (const part of validParts) {
        cumulativeProbability += part.probability;
        if (random <= cumulativeProbability) {
            return part;
        }
    }
    
    return validParts[0];
}

// 在畫布上繪製圖片
function drawImageOnCanvas(imageData, canvas) {
    const img = new Image();
    img.onload = function() {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
}

// 保存當前圖片
function saveCurrentImage() {
    if (isCanvasBlank(resultCanvas)) {
        alert('請先生成圖片');
        return;
    }
    
    const link = document.createElement('a');
    link.download = '合成圖片.png';
    link.href = resultCanvas.toDataURL('image/png');
    link.click();
}

// 保存所有圖片
function saveAllImages() {
    if (isCanvasBlank(resultCanvas)) {
        alert('請先生成圖片');
        return;
    }
    
    if (typeof JSZip === 'undefined') {
        alert('批量下載功能需要載入JSZip庫，請在<head>中添加: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>');
        return;
    }
    
    const zip = new JSZip();
    const imgFolder = zip.folder("合成圖片");
    
    const mainData = resultCanvas.toDataURL('image/png').split(',')[1];
    imgFolder.file("PNG.png", mainData, { base64: true });
    
    const batchCanvases = document.querySelectorAll('.batch-canvas');
    batchCanvases.forEach((canvas, index) => {
        const data = canvas.toDataURL('image/png').split(',')[1];
        imgFolder.file(`PNG-${index + 1}.png`, data, { base64: true });
    });
    
    zip.generateAsync({ type: "blob" }).then(content => {
        const link = document.createElement('a');
        link.download = 'NFT.zip';
        link.href = URL.createObjectURL(content);
        link.click();
    });
}

// 清空畫布
function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#999';
    ctx.font = '20px Arial';
    ctx.fillText('生成的圖片將顯示在這裡', resultCanvas.width/2, resultCanvas.height/2);
}

// 檢查畫布是否空白
function isCanvasBlank(canvas) {
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
}

// 初始化
updateProbabilityValue();