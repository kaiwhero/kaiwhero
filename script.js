// ==========================================
// 1. TABELAS DE PREÇOS E CONFIGURAÇÕES
// ==========================================
const priceMatrix = {
    sketches: [
        { label: "Head - $30", value: 30 },
        { label: "Bust - $40", value: 40 },
        { label: "Full - $60", value: 60 }
    ],
    flat: [
        { label: "Head - $45", value: 45 },
        { label: "Bust - $60", value: 60 },
        { label: "Full - $80", value: 80 }
    ],
    render: [
        { label: "Headshot - $50", value: 50 },
        { label: "Halfbody - $70", value: 70 },
        { label: "Fullbody - $100", value: 100 }
    ],
    refsheet: [ 
        { label: "Basic Layout - $150", value: 150 },
        { label: "Complete Layout (Extra Details) - $250", value: 250 }
    ]
};

const addonPriceMatrix = {
    sketches: { bg: 20.00, variants: 10.00 },
    flat:     { bg: 30.00, variants: 15.00 },
    render:   { bg: 50.00, variants: 25.00 }
};

const refAddonPrices = {
    closeup: 30.00,
    complete: 40.00
};

let addonsState = { char: false, bg: false, variants: false, basic: false, complete: false };
let currentStep = 1;
const totalSteps = 4;

// ==========================================
// 2. NAVEGAÇÃO PRINCIPAL (ABAS TIPO MENU)
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    
    const targetNav = document.getElementById(`nav-${tabId}`);
    const targetPage = document.getElementById(`page-${tabId}`);
    
    if (targetNav) targetNav.classList.add('active');
    if (targetPage) targetPage.classList.add('active');
    
    const mainWindow = document.getElementById('main-window');
    if (mainWindow) mainWindow.scrollTop = 0;
}

// ==========================================
// 3. LÓGICA DO FORMULÁRIO E VALIDAÇÃO ESTREITA
// ==========================================
function handleTypeChange() {
    const typeSelect = document.getElementById('vgen-type');
    const sizeArea = document.getElementById('vgen-size-area');
    const sizeSelect = document.getElementById('vgen-size');
    const addonsArea = document.getElementById('vgen-addons-area');
    const addonsPlaceholder = document.getElementById('vgen-addons-placeholder');

    addonsState = { char: false, bg: false, variants: false, basic: false, complete: false };
    document.querySelectorAll('.vgen-addon-card').forEach(card => card.classList.remove('selected'));
    document.querySelectorAll('input[id^="vgen-addon-input-"]').forEach(input => input.value = "No");

    if (!typeSelect) return;
    const selectedType = typeSelect.value;
    sizeSelect.innerHTML = "";

    if (priceMatrix[selectedType]) {
        priceMatrix[selectedType].forEach(item => {
            let opt = document.createElement('option');
            opt.value = item.value;
            opt.textContent = item.label;
            sizeSelect.appendChild(opt);
        });

        if (sizeArea) sizeArea.style.display = "block";
        if (addonsArea) addonsArea.style.display = "flex";
        if (addonsPlaceholder) addonsPlaceholder.style.display = "none";
    }
    
    const normalAddons = document.querySelectorAll('.addon-normal');
    const refAddons = document.querySelectorAll('.addon-ref-exclusive');

    if (selectedType === "refsheet") {
        normalAddons.forEach(el => el.style.display = 'none');
        refAddons.forEach(el => el.style.display = 'flex');
    } else {
        normalAddons.forEach(el => el.style.display = 'flex');
        refAddons.forEach(el => el.style.display = 'none');
    }

    calculateTotal();
    updateButtonStates();
}

function toggleAddonCard(addonId) {
    const card = document.getElementById(`addon-card-${addonId}`);
    const hiddenInput = document.getElementById(`vgen-addon-input-${addonId}`);
    
    addonsState[addonId] = !addonsState[addonId];
    
    if (addonsState[addonId]) {
        if (card) card.classList.add('selected');
        if (hiddenInput) hiddenInput.value = "Yes";
    } else {
        if (card) card.classList.remove('selected');
        if (hiddenInput) hiddenInput.value = "No";
    }
    calculateTotal();
}

// Bloqueia avanço caso inputs com 'required' no painel atual estejam vazios
function validateCurrentStep() {
    const currentPane = document.getElementById(`vgen-step-pane-${currentStep}`);
    if (!currentPane) return true;

    // Busca selects, inputs e textareas marcados como obrigatórios no painel atual
    const requiredFields = currentPane.querySelectorAll('select[required], input[required], textarea[required]');
    
    for (let field of requiredFields) {
        if (!field.value || field.value.trim() === "") {
            return false; // Trava se encontrar algum vazio
        }
    }
    return true; 
}

// ==========================================
// 4. SISTEMA DE CÁLCULO DE VALORES DINÂMICOS
// ==========================================
function calculateTotal() {
    const typeSelect = document.getElementById('vgen-type');
    const sizeSelect = document.getElementById('vgen-size');
    const sizePriceTag = document.getElementById('vgen-size-price-addon');
    
    // IDs dos badges
    const charBadge = document.getElementById('vgen-addon-calculated-badge-char');
    const bgBadge = document.getElementById('vgen-addon-calculated-badge-bg');
    const variantsBadge = document.getElementById('vgen-addon-calculated-badge-variants');
    
    const addonsGlobalPriceDisplay = document.getElementById('vgen-addons-global-price');
    const commercialSelect = document.getElementById('vgen-commercial');
    const totalDisplay = document.getElementById('vgen-total');
    const basicBadge = document.getElementById('vgen-addon-calculated-badge-basic');
    const completeBadge = document.getElementById('vgen-addon-calculated-badge-complete');

    // Se não houver tamanho selecionado, não calculamos
    if (!sizeSelect || !sizeSelect.value) return;

    const basePrice = parseFloat(sizeSelect.value);
    const currentType = typeSelect.value;
    
    // 1. Atualiza o preço base visual
    sizePriceTag.textContent = `+$${basePrice.toFixed(2)}`;

    // 2. Calcula valores dos Add-ons (usando a matriz de referência)
    const charAddonPrice = basePrice * 0.80;
    const bgAddonPrice = basePrice * 0.70;
    const variantsAddonPrice = basePrice * 0.55;
    const refCloseupPrice = refAddonPrices.closeup;
    const refCompletePrice = refAddonPrices.complete;

    // 3. ATUALIZAÇÃO VISUAL FORÇADA: Garante que os números mudem ao trocar o select
    if (charBadge) charBadge.textContent = `+$${charAddonPrice.toFixed(2)}`;
    if (bgBadge) bgBadge.textContent = `+$${bgAddonPrice.toFixed(2)}`;
    if (variantsBadge) variantsBadge.textContent = `+$${variantsAddonPrice.toFixed(2)}`;
    if (basicBadge) basicBadge.textContent = currentType === 'refsheet' ? `+$${refCloseupPrice.toFixed(2)}` : '+$0.00';
    if (completeBadge) completeBadge.textContent = currentType === 'refsheet' ? `+$${refCompletePrice.toFixed(2)}` : '+$0.00';

    // 4. Soma acumulada dos selecionados
    let totalAddonsAccumulated = 0;
    if (addonsState.char) totalAddonsAccumulated += charAddonPrice;
    if (addonsState.bg) totalAddonsAccumulated += bgAddonPrice;
    if (addonsState.variants) totalAddonsAccumulated += variantsAddonPrice;
    if (addonsState.basic) totalAddonsAccumulated += refCloseupPrice;
    if (addonsState.complete) totalAddonsAccumulated += refCompletePrice;

    addonsGlobalPriceDisplay.textContent = `+$${totalAddonsAccumulated.toFixed(2)}`;

    // 5. Cálculo do Total Final com Taxa Comercial
    const commercialMultiplier = parseFloat(commercialSelect.value || 0);
    const currentSubtotal = basePrice + totalAddonsAccumulated;
    const finalTotal = currentSubtotal * (1 + commercialMultiplier);

    totalDisplay.textContent = `$${finalTotal.toFixed(2)}`;
}
// ==========================================
// 5. FLUXO E GERENCIAMENTO DE INTERAÇÕES
// ==========================================
function updateButtonStates() {
    const backBtn = document.getElementById('vgen-back-btn');
    const nextBtn = document.getElementById('vgen-next-btn');

    if (!backBtn || !nextBtn) return;

    // Controle do botão Voltar
    if (currentStep === 1) {
        backBtn.classList.remove('active-btn');
        backBtn.disabled = true;
    } else {
        backBtn.classList.add('active-btn');
        backBtn.disabled = false;
    }

    // Executa validação de campos obrigatórios antes de liberar o botão Next/Submit
    if (validateCurrentStep()) {
        nextBtn.classList.add('active-btn');
        nextBtn.disabled = false;
    } else {
        nextBtn.classList.remove('active-btn');
        nextBtn.disabled = true;
    }

    if (currentStep === totalSteps) {
        nextBtn.textContent = "Submit";
    } else {
        nextBtn.textContent = "Next";
    }
}

function moveStep(direction) {
    if (direction === 1 && !validateCurrentStep()) return;

    if (direction === 1 && currentStep === totalSteps) {
        const form = document.getElementById('vgen-intake-form');
        if (form) form.submit();
        return;
    }

    currentStep += direction;
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;

    document.querySelectorAll('.vgen-step-item').forEach((el, index) => {
        if (index + 1 === currentStep) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    for (let i = 1; i <= totalSteps; i++) {
        const pane = document.getElementById(`vgen-step-pane-${i}`);
        if (pane) {
            if (i === currentStep) {
                pane.style.display = "block";
                pane.classList.add('active');
            } else {
                pane.style.display = "none";
                pane.classList.remove('active');
            }
        }
    }

    updateButtonStates();
    
    const mainWindow = document.getElementById('main-window');
    if (mainWindow) mainWindow.scrollTop = 0;
}

function changeImage(thumbElement, imageUrl) {
    document.querySelectorAll('.gallery-thumbs-vertical .v-thumb').forEach(t => t.classList.remove('active'));
    if (thumbElement) thumbElement.classList.add('active');
    const mainView = document.getElementById('main-view');
    if (mainView) mainView.src = imageUrl;
}

function filterGallery(event, category) {
    document.querySelectorAll('.gallery-filters-sub span').forEach(s => s.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const thumbs = document.querySelectorAll('.gallery-thumbs-vertical .v-thumb');
    let firstMatch = null;
    thumbs.forEach(t => {
        if (category === 'all' || t.getAttribute('data-cat') === category) {
            t.style.display = 'block';
            if (!firstMatch) firstMatch = t;
        } else {
            t.style.display = 'none';
        }
    });
    if (firstMatch) firstMatch.click();
}

// Atualiza os labels da fila: se o texto for 'working' aplica a cor vermelha, caso contrário fica cinza
function updateQueueStatuses() {
    document.querySelectorAll('.queue-slot').forEach(slot => {
        const status = slot.querySelector('.slot-status');
        if (!status) return;

        const isWorking = status.textContent.trim().toLowerCase() === 'working';
        status.textContent = isWorking ? 'working' : 'waiting';
        status.style.color = isWorking ? '#ff0033' : '#444';
    });
}



document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('vgen-intake-form');
    const sizeSelect = document.getElementById('vgen-size');
    const typeSelect = document.getElementById('vgen-type');
    const commercialSelect = document.getElementById('vgen-commercial');

    if (form) {
        form.addEventListener('input', updateButtonStates);
        form.addEventListener('change', updateButtonStates);
    }
    
    // Adicionamos os listeners abaixo para garantir que qualquer mudança 
    // force o recálculo dos valores dos addons
    if (sizeSelect) {
        sizeSelect.addEventListener('change', calculateTotal);
    }
    
    if (typeSelect) {
        typeSelect.addEventListener('change', calculateTotal);
    }

    if (commercialSelect) {
        commercialSelect.addEventListener('change', calculateTotal);
    }

    calculateTotal();
    updateButtonStates();
    // atualiza status da fila conforme cor
    try { updateQueueStatuses(); } catch (e) { }
}
);
