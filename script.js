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

// Add-ons normais: percentual do preço base. Add-ons de ref sheet: valor fixo.
const ADDON_RATES = { char: 0.80, bg: 0.70, variants: 0.55 };
const REF_ADDON_PRICES = { basic: 30, complete: 40 };
const TOTAL_STEPS = 4;

const $ = (id) => document.getElementById(id);
const money = (n) => `$${n.toFixed(2)}`;

let addonsState = { char: false, bg: false, variants: false, basic: false, complete: false };
let currentStep = 1;

// ==========================================
// 2. NAVEGAÇÃO PRINCIPAL (ABAS)
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        el.removeAttribute('aria-current');
    });
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));

    const nav = $(`nav-${tabId}`);
    if (nav) {
        nav.classList.add('active');
        nav.setAttribute('aria-current', 'page');
    }
    $(`page-${tabId}`)?.classList.add('active');

    document.querySelector('.navbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// 3. FORMULÁRIO: TIPO, ADD-ONS E VALIDAÇÃO
// ==========================================
function resetAddons() {
    addonsState = { char: false, bg: false, variants: false, basic: false, complete: false };
    document.querySelectorAll('.vgen-addon-card').forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
    });
    document.querySelectorAll('input[id^="vgen-addon-input-"]').forEach(input => input.value = "No");
}

function handleTypeChange() {
    const type = $('vgen-type').value;
    const sizeSelect = $('vgen-size');
    resetAddons();

    sizeSelect.innerHTML = "";
    if (priceMatrix[type]) {
        priceMatrix[type].forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.value;
            opt.textContent = item.label;
            sizeSelect.appendChild(opt);
        });
        $('vgen-size-area').style.display = "block";
        $('vgen-addons-area').style.display = "flex";
        $('vgen-addons-placeholder').style.display = "none";
    }

    const isRef = type === "refsheet";
    document.querySelectorAll('.addon-normal').forEach(el => el.style.display = isRef ? 'none' : 'flex');
    document.querySelectorAll('.addon-ref-exclusive').forEach(el => el.style.display = isRef ? 'flex' : 'none');

    calculateTotal();
    updateButtonStates();
}

function toggleAddonCard(addonId) {
    addonsState[addonId] = !addonsState[addonId];
    const on = addonsState[addonId];

    const card = $(`addon-card-${addonId}`);
    card?.classList.toggle('selected', on);
    card?.setAttribute('aria-checked', String(on));
    $(`vgen-addon-input-${addonId}`).value = on ? "Yes" : "No";

    calculateTotal();
}

// Só libera o avanço se todos os campos obrigatórios do painel atual forem válidos
function validateCurrentStep() {
    const pane = $(`vgen-step-pane-${currentStep}`);
    if (!pane) return true;
    return [...pane.querySelectorAll('[required]')]
        .every(field => field.value.trim() !== "" && field.checkValidity());
}

// ==========================================
// 4. CÁLCULO DE VALORES
// ==========================================
function calculateTotal() {
    const sizeSelect = $('vgen-size');
    if (!sizeSelect || !sizeSelect.value) return;

    const type = $('vgen-type').value;
    const isRef = type === 'refsheet';
    const base = parseFloat(sizeSelect.value);

    const prices = {
        char: base * ADDON_RATES.char,
        bg: base * ADDON_RATES.bg,
        variants: base * ADDON_RATES.variants,
        basic: isRef ? REF_ADDON_PRICES.basic : 0,
        complete: isRef ? REF_ADDON_PRICES.complete : 0
    };

    $('vgen-size-price-addon').textContent = `+${money(base)}`;

    let addonsTotal = 0;
    for (const key in prices) {
        const badge = $(`vgen-addon-calculated-badge-${key}`);
        if (badge) badge.textContent = `+${money(prices[key])}`;
        if (addonsState[key]) addonsTotal += prices[key];
    }
    $('vgen-addons-global-price').textContent = `+${money(addonsTotal)}`;

    const commercial = parseFloat($('vgen-commercial').value) || 0;
    const total = (base + addonsTotal) * (1 + commercial);
    $('vgen-total').textContent = money(total);

    // Enviados junto com o formulário (antes só o número do tamanho ia no e-mail)
    $('vgen-total-input').value = money(total);
    $('vgen-size-label').value = sizeSelect.options[sizeSelect.selectedIndex].textContent;
}

// ==========================================
// 5. FLUXO DO FORMULÁRIO
// ==========================================
function updateButtonStates() {
    const backBtn = $('vgen-back-btn');
    const nextBtn = $('vgen-next-btn');
    if (!backBtn || !nextBtn) return;

    backBtn.disabled = currentStep === 1;
    backBtn.classList.toggle('active-btn', currentStep > 1);

    const valid = validateCurrentStep();
    nextBtn.disabled = !valid;
    nextBtn.classList.toggle('active-btn', valid);
    nextBtn.textContent = currentStep === TOTAL_STEPS ? "Submit" : "Next";
}

function moveStep(direction) {
    if (direction === 1 && !validateCurrentStep()) return;

    if (direction === 1 && currentStep === TOTAL_STEPS) {
        const nextBtn = $('vgen-next-btn');
        nextBtn.disabled = true; // evita envio duplicado
        nextBtn.textContent = "Sending...";
        $('vgen-intake-form').submit();
        return;
    }

    currentStep = Math.min(Math.max(currentStep + direction, 1), TOTAL_STEPS);

    document.querySelectorAll('.vgen-step-item').forEach((el, i) =>
        el.classList.toggle('active', i + 1 === currentStep));
    document.querySelectorAll('.vgen-step-pane').forEach((pane, i) =>
        pane.classList.toggle('active', i + 1 === currentStep));

    updateButtonStates();
    document.querySelector('.navbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// 6. GALERIA
// ==========================================
function changeImage(thumb, imageUrl) {
    document.querySelectorAll('.gallery-thumbs-vertical .v-thumb').forEach(t => t.classList.remove('active'));
    thumb?.classList.add('active');
    const mainView = $('main-view');
    if (mainView) mainView.src = imageUrl;
}

function filterGallery(event, category) {
    document.querySelectorAll('.gallery-filters-sub button').forEach(b => b.classList.remove('active'));
    event?.currentTarget?.classList.add('active');

    let firstMatch = null;
    document.querySelectorAll('.gallery-thumbs-vertical .v-thumb').forEach(t => {
        const match = category === 'all' || t.dataset.cat === category;
        t.style.display = match ? '' : 'none';
        if (match && !firstMatch) firstMatch = t;
    });
    firstMatch?.click();
}

// ==========================================
// 7. FILA
// ==========================================
function updateQueueStatuses() {
    document.querySelectorAll('.queue-slot .slot-status').forEach(status => {
        const working = status.textContent.trim().toLowerCase() === 'working';
        status.textContent = working ? 'working' : 'waiting';
        status.classList.toggle('waiting', !working);
    });
}

// ==========================================
// 8. INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const form = $('vgen-intake-form');
    if (form) {
        form.addEventListener('input', updateButtonStates);
        form.addEventListener('change', updateButtonStates);
    }
    $('vgen-size')?.addEventListener('change', calculateTotal);
    $('vgen-commercial')?.addEventListener('change', calculateTotal);

    // Cards de add-on acessíveis por teclado e leitor de tela
    document.querySelectorAll('.vgen-addon-card').forEach(card => {
        const id = card.id.replace('addon-card-', '');
        card.setAttribute('role', 'checkbox');
        card.setAttribute('aria-checked', 'false');
        card.tabIndex = 0;
        card.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleAddonCard(id);
            }
        });
    });

    // Liga cada <label> visual ao seu campo (aria-label)
    document.querySelectorAll('.vgen-select-wrapper, .vgen-input-container, .vgen-textarea-container').forEach(box => {
        const label = box.querySelector('label');
        const field = box.querySelector('select, input, textarea');
        if (label && field) field.setAttribute('aria-label', label.textContent.trim());
    });

    calculateTotal();
    updateButtonStates();
    updateQueueStatuses();
});
