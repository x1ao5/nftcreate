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
const clearCategoryBtn = document.getElementById('clear-category-btn');
const partsList = document.getElementById('parts-list');
const generateBtn = document.getElementById('generate-btn');
const generateCount = document.getElementById('generate-count');
const clearAllBtn = document.getElementById('clear-all-btn');
const resultCanvas = document.getElementById('result-canvas');
const batchResults = document.getElementById('batch-results');
const saveBtn = document.getElementById('save-btn');
const saveAllBtn = document.getElementById('save-all-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const themeToggle = document.querySelector('.theme-toggle');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressStatus = document.getElementById('progress-status');
const progressCount = document.getElementById('progress-count');

// 初始化畫布
const ctx = resultCanvas.getContext('2d');
clearCanvas();

// 事件監聽器
probabilityInput.addEventListener('input', updateProbabilityValue);
imageUpload.addEventListener('change', handleSingleUpload);
folderUpload.addEventListener('change', handleFolderUpload);
generateBtn.addEventListener('click', generateImages);
clearAllBtn.addEventListener('click', clearAllParts);
clearCategoryBtn.addEventListener('click', clearCurrentCategory);
saveBtn.addEventListener('click', saveCurrentImage);
saveAllBtn.addEventListener('click', saveAllImages);
tabButtons.forEach(btn => btn.addEventListener('click', filterPartsByCategory));
themeToggle.addEventListener('click', toggleTheme);

// 檢查並應用保存的主題
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// 更新機率顯示
function updateProbabilityValue() {
    const value = probabilityInput.value;
    probabilityValue.textContent = `${value}%`;
    updateRarityIndicator(value);
}

function updateRarityIndicator(value) {
    const val = parseInt(value);
    probabilityValue.className = 'probability-badge';
    
    if (val <= 10) {
        probabilityValue.classList.add('legendary');
    } else if (val <= 30) {
        probabilityValue.classList.add('rare');
    } else if (val <= 60) {
        probabilityValue.classList.add('uncommon');
    } else {
        probabilityValue.classList.add('common');
    }
    
    // 更新稀有度指示器
    document.querySelectorAll('.rarity-level').forEach(level => {
        level.classList.remove('active');
    });
    
    if (val <= 10) {
        document.querySelector('.rarity-level.legendary').classList.add('active');
    } else if (val <= 30) {
        document.querySelector('.rarity-level.rare').classList.add('active');
    } else if (val <= 60) {
        document.querySelector('.rarity-level.uncommon').classList.add('active');
    } else {
        document.querySelector('.rarity-level.common').classList.add('active');
    }
}

// 處理單個文件上傳
function handleSingleUpload() {
    if (imageUpload.files.length === 0) return;
    
    const category = categorySelect.value;
    const probability = parseInt(probabilityInput.value);
    const isOptional = optionalToggle.checked;
    const file = imageUpload.files[0];
    
    if (probability < 1 || probability > 100) {
        alert('機率必須在1-100之間');
        return;
    }
    
    showUploadProgress(1);
    
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
        
        updateProgress(1, 1);
        setTimeout(() => {
            uploadProgress.classList.add('hidden');
            updatePartsList();
        }, 500);
    };
    reader.readAsDataURL(file);
}

// 處理資料夾上傳
function handleFolderUpload(e) {
    const files = Array.from(e.target.files);
    const category = categorySelect.value;
    const probability = parseInt(probabilityInput.value);
    const isOptional = optionalToggle.checked;
    
    if (files.length === 0) return;
    
    showUploadProgress(files.length);
    
    let processed = 0;
    const imageFiles = files.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
        progressStatus.textContent = '沒有找到圖片文件';
        updateProgress(0, 0);
        return;
    }
    
    imageFiles.forEach((file, index) => {
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
            updateProgress(processed, imageFiles.length);
            
            if (processed === imageFiles.length) {
                setTimeout(() => {
                    uploadProgress.classList.add('hidden');
                    updatePartsList();
                }, 500);
            }
        };
        reader.readAsDataURL(file);
    });
}

// 顯示上傳進度
function showUploadProgress(total) {
    uploadProgress.classList.remove('hidden');
    progressStatus.textContent = '正在上傳...';
    progressCount.textContent = `0/${total}`;
    progressBar.style.width = '0%';
}

// 更新上傳進度
function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressCount.textContent = `${current}/${total}`;
    
    if (current === total) {
        progressStatus.textContent = '上傳完成！';
    }
}

// 更新部件列表
function updatePartsList() {
    // 檢查是否有部件
    const hasParts = Object.values(partsDatabase).some(category => category.length > 0);
    
    if (!hasParts) {
        partsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>尚未添加任何部件</p>
                <small>請先上傳圖片部件</small>
            </div>
        `;
        return;
    }
    
    partsList.innerHTML = '';
    
    // 獲取當前選中的分類
    const activeTab = document.querySelector('.tab-btn.active');
    const activeCategory = activeTab ? activeTab.dataset.category : 'all';
    
    // 顯示所有部件
    for (const category in partsDatabase) {
        partsDatabase[category].forEach(part => {
            // 如果當前標籤不是"全部"且不匹配分類，則跳過
            if (activeCategory !== 'all' && part.category !== activeCategory) return;
            
            const partItem = document.createElement('div');
            partItem.className = 'part-item fade-in';
            partItem.dataset.id = part.id;
            
            // 根據機率設置稀有度類別
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
    
    // 為刪除按鈕添加事件
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

// 清空當前類別
function clearCurrentCategory() {
    const category = categorySelect.value;
    if (partsDatabase[category].length === 0) return;
    
    if (confirm(`確定要清空 ${category} 類別的所有部件嗎？`)) {
        partsDatabase[category] = [];
        updatePartsList();
    }
}

// 清空所有部件
function clearAllParts() {
    const hasParts = Object.values(partsDatabase).some(category => category.length > 0);
    if (!hasParts) return;
    
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
    // 檢查是否有足夠部件
    for (const category in partsDatabase) {
        if (partsDatabase[category].length === 0 && !hasOptionalParts(category)) {
            alert(`請至少上傳一個${category}部件`);
            return;
        }
    }
    
    const count = parseInt(generateCount.value);
    
    // 清空之前的批量結果
    batchResults.innerHTML = '';
    
    // 生成主結果
    generateSingleImage(resultCanvas);
    
    // 如果選擇生成多張，則生成批量結果
    if (count > 1) {
        for (let i = 0; i < count - 1; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 250;
            canvas.height = 250;
            canvas.className = 'batch-canvas fade-in';
            
            const container = document.createElement('div');
            container.className = 'batch-result-item';
            container.appendChild(canvas);
            
            batchResults.appendChild(container);
            
            // 生成圖片
            setTimeout(() => {
                generateSingleImage(canvas);
            }, i * 100); // 稍微錯開生成時間，避免卡頓
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
    
    // 按順序合成圖片 (背景 → 身體 → 頭部 → 配件)
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
    
    // 隱藏佔位符
    const placeholder = canvas.parentElement.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
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
    
    // 添加主圖片
    const mainData = resultCanvas.toDataURL('image/png').split(',')[1];
    imgFolder.file("PNG.png", mainData, { base64: true });
    
    // 添加批量圖片
    const batchCanvases = document.querySelectorAll('.batch-canvas');
    batchCanvases.forEach((canvas, index) => {
        const data = canvas.toDataURL('image/png').split(',')[1];
        imgFolder.file(`PNG-${index + 1}.png`, data, { base64: true });
    });
    
    // 生成ZIP文件
    zip.generateAsync({ type: "blob" }).then(content => {
        const link = document.createElement('a');
        link.download = 'NFT.zip';
        link.href = URL.createObjectURL(content);
        link.click();
    });
}

// 清空畫布
function clearCanvas() {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    
    // 顯示佔位符
    const placeholder = document.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
}

// 檢查畫布是否空白
function isCanvasBlank(canvas) {
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    const ctx = blank.getContext('2d');
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, blank.width, blank.height);
    return canvas.toDataURL() === blank.toDataURL();
}

// 切換主題
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 更新主題圖標
function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// 初始化
updateProbabilityValue();