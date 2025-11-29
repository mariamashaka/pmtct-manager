// ============================================
// PATIENT LIST - JavaScript
// ============================================

let currentLanguage = 'en';
let allPatients = [];
let filteredPatients = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Patient list initialized');
    
    // Load language preference
    const savedLanguage = localStorage.getItem('pmtct_language');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        updateLanguageButtons();
        updateLanguage();
    }
    
    // Load patients
    loadPatients();
    
    // Display patients
    displayPatients();
});

// ============================================
// LOAD PATIENTS
// ============================================

function loadPatients() {
    const savedPatients = localStorage.getItem('pmtct_patients');
    if (savedPatients) {
        allPatients = JSON.parse(savedPatients);
        filteredPatients = [...allPatients];
    } else {
        allPatients = [];
        filteredPatients = [];
    }
    
    console.log(`Loaded ${allPatients.length} patients`);
}

// ============================================
// DISPLAY PATIENTS
// ============================================

function displayPatients() {
    const container = document.getElementById('patient-list');
    const emptyState = document.getElementById('empty-state');
    const countElement = document.getElementById('patient-count');
    
    // Update count
    countElement.textContent = filteredPatients.length;
    
    if (filteredPatients.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort by last visit date (most recent first)
    filteredPatients.sort((a, b) => {
        const dateA = a.lastVisitDate ? new Date(a.lastVisitDate) : new Date(0);
        const dateB = b.lastVisitDate ? new Date(b.lastVisitDate) : new Date(0);
        return dateB - dateA;
    });
    
    // Generate HTML
    let html = '';
    filteredPatients.forEach(patient => {
        html += generatePatientCard(patient);
    });
    
    container.innerHTML = html;
}

function generatePatientCard(patient) {
    // Determine status
    const status = getPatientStatus(patient);
    const statusBadge = getStatusBadge(status);
    
    // Calculate days since last visit
    const daysSinceVisit = patient.lastVisitDate 
        ? Math.floor((new Date() - new Date(patient.lastVisitDate)) / (1000 * 60 * 60 * 24))
        : null;
    
    const lastVisitText = patient.lastVisitDate
        ? `${patient.lastVisitDate} (${daysSinceVisit} ${currentLanguage === 'en' ? 'days ago' : 'siku zilizopita'})`
        : (currentLanguage === 'en' ? 'Never' : 'Kamwe');
    
    // Check for alerts
    const alerts = getPatientAlerts(patient);
    const alertBadge = alerts.length > 0
        ? `<span class="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">${alerts.length} ${currentLanguage === 'en' ? 'alerts' : 'tahadhari'}</span>`
        : '';
    
    return `
        <div class="patient-card bg-white rounded-lg shadow-md p-6 cursor-pointer" onclick="openVisit('${patient.id}')">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900">${patient.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">
                        <span class="font-medium">CTC ID:</span> ${patient.uniqueCTCID}
                        ${patient.phone ? ` | <span class="font-medium">${currentLanguage === 'en' ? 'Phone:' : 'Simu:'}</span> ${patient.phone}` : ''}
                    </p>
                </div>
                <div class="text-right">
                    ${statusBadge}
                    ${alertBadge}
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <!-- Age -->
                <div>
                    <p class="text-gray-600" data-en="Age" data-sw="Umri">${currentLanguage === 'en' ? 'Age' : 'Umri'}</p>
                    <p class="font-semibold text-gray-900">${patient.age} ${currentLanguage === 'en' ? 'years' : 'miaka'}</p>
                </div>
                
                <!-- Last Visit -->
                <div>
                    <p class="text-gray-600">${currentLanguage === 'en' ? 'Last Visit' : 'Ziara ya Mwisho'}</p>
                    <p class="font-semibold text-gray-900 ${daysSinceVisit > 30 ? 'text-red-600' : ''}">${lastVisitText}</p>
                </div>
                
                <!-- Latest VL -->
                <div>
                    <p class="text-gray-600">${currentLanguage === 'en' ? 'Latest VL' : 'VL ya Mwisho'}</p>
                    <p class="font-semibold ${getVLColor(patient.latestVL)}">${patient.latestVL !== null && patient.latestVL !== undefined ? patient.latestVL : '-'}</p>
                </div>
                
                <!-- Latest CD4 -->
                <div>
                    <p class="text-gray-600">${currentLanguage === 'en' ? 'Latest CD4' : 'CD4 ya Mwisho'}</p>
                    <p class="font-semibold ${getCD4Color(patient.latestCD4)}">${patient.latestCD4 || '-'}</p>
                </div>
            </div>
            
            <!-- Additional Info -->
            <div class="flex flex-wrap gap-2 mb-4">
                ${patient.pregnant ? `<span class="text-xs px-2 py-1 bg-pink-100 text-pink-800 rounded-full">🤰 ${currentLanguage === 'en' ? 'Pregnant' : 'Mjamzito'}</span>` : ''}
                ${patient.breastfeeding ? `<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">👶 ${currentLanguage === 'en' ? 'Breastfeeding' : 'Ananyonyesha'}</span>` : ''}
                ${patient.children && patient.children.length > 0 ? `<span class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">${patient.children.length} ${currentLanguage === 'en' ? 'child(ren)' : 'mtoto/watoto'}</span>` : ''}
                ${patient.onCoTrimoxazole ? `<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">💊 Co-trimoxazole</span>` : ''}
                ${patient.eac && patient.eac.started ? `<span class="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">📚 EAC</span>` : ''}
            </div>
            
            <!-- Alerts -->
            ${alerts.length > 0 ? `
                <div class="mb-4 space-y-2">
                    ${alerts.map(alert => `
                        <div class="text-xs p-2 rounded ${alert.priority === 'critical' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}">
                            ${alert.priority === 'critical' ? '❗' : '⚠️'} ${alert.message}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Action Button -->
            <div class="flex justify-end">
                <button class="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                    <span data-en="Open Visit" data-sw="Fungua Ziara">${currentLanguage === 'en' ? 'Open Visit' : 'Fungua Ziara'}</span>
                    <span class="ml-2">→</span>
                </button>
            </div>
        </div>
    `;
}

// ============================================
// PATIENT STATUS HELPERS
// ============================================

function getPatientStatus(patient) {
    if (patient.latestVL === null || patient.latestVL === undefined) {
        return 'unknown';
    }
    
    if (patient.latestVL < 50) {
        return 'good';
    } else if (patient.latestVL <= 1000) {
        return 'warning';
    } else {
        return 'critical';
    }
}

function getStatusBadge(status) {
    const badges = {
        good: {
            en: 'VL Suppressed',
            sw: 'VL Imezuiliwa',
            class: 'status-good'
        },
        warning: {
            en: 'VL Detectable',
            sw: 'VL Inaonekana',
            class: 'status-warning'
        },
        critical: {
            en: 'VL High',
            sw: 'VL Juu',
            class: 'status-critical'
        },
        unknown: {
            en: 'No VL Data',
            sw: 'Hakuna Data ya VL',
            class: 'status-badge bg-gray-100 text-gray-800'
        }
    };
    
    const badge = badges[status];
    const text = currentLanguage === 'en' ? badge.en : badge.sw;
    
    return `<span class="status-badge ${badge.class}">${text}</span>`;
}

function getVLColor(vl) {
    if (vl === null || vl === undefined) return 'text-gray-900';
    if (vl < 50) return 'text-green-600';
    if (vl <= 1000) return 'text-yellow-600';
    return 'text-red-600';
}

function getCD4Color(cd4) {
    if (!cd4) return 'text-gray-900';
    if (cd4 < 200) return 'text-red-600';
    if (cd4 < 350) return 'text-yellow-600';
    return 'text-green-600';
}

function getPatientAlerts(patient) {
    const alerts = [];
    const today = new Date();
    
    // HVL overdue
    if (patient.nextHVLDate) {
        const nextHVL = new Date(patient.nextHVLDate);
        if (today > nextHVL) {
            const daysOverdue = Math.floor((today - nextHVL) / (1000 * 60 * 60 * 24));
            alerts.push({
                priority: 'critical',
                message: currentLanguage === 'en' 
                    ? `HVL overdue by ${daysOverdue} days`
                    : `HVL imechelewa siku ${daysOverdue}`
            });
        }
    }
    
    // VL >1000 and no EAC
    if (patient.latestVL && patient.latestVL > 1000) {
        if (!patient.eac || !patient.eac.started) {
            alerts.push({
                priority: 'critical',
                message: currentLanguage === 'en'
                    ? 'High VL - Start EAC sessions'
                    : 'VL juu - Anza vikao vya EAC'
            });
        }
    }
    
    // CD4 <200 and no CrAg
    if (patient.latestCD4 && patient.latestCD4 < 200) {
        const hasCrAg = patient.crAgHistory && patient.crAgHistory.length > 0;
        if (!hasCrAg) {
            alerts.push({
                priority: 'critical',
                message: currentLanguage === 'en'
                    ? 'CD4 <200 - Do CrAg test'
                    : 'CD4 <200 - Fanya kipimo cha CrAg'
            });
        }
    }
    
    // Missed visit >2 weeks
    if (patient.lastVisitDate) {
        const lastVisit = new Date(patient.lastVisitDate);
        const daysSince = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
        if (daysSince > 14) {
            alerts.push({
                priority: 'warning',
                message: currentLanguage === 'en'
                    ? `No visit for ${daysSince} days`
                    : `Hakujafika kwa siku ${daysSince}`
            });
        }
    }
    
    return alerts;
}

// ============================================
// FILTER & SEARCH
// ============================================

function filterPatients() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    
    filteredPatients = allPatients.filter(patient => {
        // Search filter
        const matchesSearch = !searchTerm || 
            patient.name.toLowerCase().includes(searchTerm) ||
            patient.uniqueCTCID.toLowerCase().includes(searchTerm) ||
            (patient.phone && patient.phone.includes(searchTerm));
        
        // Status filter
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const patientStatus = getPatientStatus(patient);
            matchesStatus = patientStatus === statusFilter;
        }
        
        return matchesSearch && matchesStatus;
    });
    
    displayPatients();
}

// ============================================
// NAVIGATION
// ============================================

function openVisit(patientId) {
    window.location.href = `visit.html?id=${patientId}`;
}

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

function changeLanguage(lang) {
    currentLanguage = lang;
    updateLanguageButtons();
    updateLanguage();
    localStorage.setItem('pmtct_language', lang);
    
    // Redisplay patients with new language
    displayPatients();
}

function updateLanguageButtons() {
    document.getElementById('btn-en').classList.remove('bg-white', 'text-teal-700');
    document.getElementById('btn-sw').classList.remove('bg-white', 'text-teal-700');
    
    if (currentLanguage === 'en') {
        document.getElementById('btn-en').classList.add('bg-white', 'text-teal-700');
    } else {
        document.getElementById('btn-sw').classList.add('bg-white', 'text-teal-700');
    }
}

function updateLanguage() {
    // Update text elements
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(element => {
        if (currentLanguage === 'en') {
            element.textContent = element.getAttribute('data-en');
        } else {
            element.textContent = element.getAttribute('data-sw');
        }
    });
    
    // Update placeholders
    const placeholderElements = document.querySelectorAll('[data-placeholder-en]');
    placeholderElements.forEach(element => {
        if (currentLanguage === 'en') {
            element.placeholder = element.getAttribute('data-placeholder-en');
        } else {
            element.placeholder = element.getAttribute('data-placeholder-sw');
        }
    });
}

console.log('Patient list ready!');
