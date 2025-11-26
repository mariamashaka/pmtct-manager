// ============================================
// PMTCT Management System - Main JavaScript
// ============================================

// Global State
let currentLanguage = 'en';
let patients = [];
let children = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('PMTCT System initialized');
    
    // Load data from localStorage
    loadData();
    
    // Update statistics
    updateStatistics();
    
    // Update alerts
    updateAlerts();
    
    // Set initial language
    updateLanguage();
});

// ============================================
// DATA MANAGEMENT
// ============================================

function loadData() {
    // Load patients from localStorage
    const savedPatients = localStorage.getItem('pmtct_patients');
    if (savedPatients) {
        patients = JSON.parse(savedPatients);
    }
    
    // Load children from localStorage
    const savedChildren = localStorage.getItem('pmtct_children');
    if (savedChildren) {
        children = JSON.parse(savedChildren);
    }
    
    console.log(`Loaded ${patients.length} patients and ${children.length} children`);
}

function saveData() {
    // Save patients to localStorage
    localStorage.setItem('pmtct_patients', JSON.stringify(patients));
    
    // Save children to localStorage
    localStorage.setItem('pmtct_children', JSON.stringify(children));
    
    console.log('Data saved to localStorage');
}

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update button styles
    document.getElementById('btn-en').classList.remove('bg-white', 'text-teal-700');
    document.getElementById('btn-sw').classList.remove('bg-white', 'text-teal-700');
    
    if (lang === 'en') {
        document.getElementById('btn-en').classList.add('bg-white', 'text-teal-700');
        document.getElementById('btn-sw').classList.add('hover:bg-white/20');
        document.getElementById('btn-sw').classList.remove('bg-white', 'text-teal-700');
    } else {
        document.getElementById('btn-sw').classList.add('bg-white', 'text-teal-700');
        document.getElementById('btn-en').classList.add('hover:bg-white/20');
        document.getElementById('btn-en').classList.remove('bg-white', 'text-teal-700');
    }
    
    // Update all text
    updateLanguage();
    
    // Save language preference
    localStorage.setItem('pmtct_language', lang);
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-en]');
    
    elements.forEach(element => {
        if (currentLanguage === 'en') {
            element.textContent = element.getAttribute('data-en');
        } else {
            element.textContent = element.getAttribute('data-sw');
        }
    });
}

// ============================================
// NAVIGATION
// ============================================

function showSection(sectionName) {
    // Hide all sections
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('add-patient-section').classList.add('hidden');
    document.getElementById('patient-list-section').classList.add('hidden');
    document.getElementById('cohort-report-section').classList.add('hidden');
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.remove('hidden');
    document.getElementById(sectionName + '-section').classList.add('fade-in');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ============================================
// STATISTICS
// ============================================

function updateStatistics() {
    // Total mothers
    document.getElementById('stat-total-mothers').textContent = patients.length;
    
    // Total children
    document.getElementById('stat-total-children').textContent = children.length;
    
    // VL statistics
    const patientsWithVL = patients.filter(p => p.latestVL !== undefined && p.latestVL !== null);
    const vlSuppressed = patientsWithVL.filter(p => p.latestVL < 50).length;
    const vlHigh = patientsWithVL.filter(p => p.latestVL > 1000).length;
    
    document.getElementById('stat-vl-suppressed').textContent = vlSuppressed;
    document.getElementById('stat-vl-high').textContent = vlHigh;
    
    if (patients.length > 0) {
        const vlSuppressedPercent = Math.round((vlSuppressed / patients.length) * 100);
        const vlHighPercent = Math.round((vlHigh / patients.length) * 100);
        document.getElementById('stat-vl-suppressed-percent').textContent = vlSuppressedPercent + '%';
        document.getElementById('stat-vl-high-percent').textContent = vlHighPercent + '%';
    }
    
    // CD4 <200
    const cd4Low = patients.filter(p => p.latestCD4 !== undefined && p.latestCD4 < 200).length;
    document.getElementById('stat-cd4-low').textContent = cd4Low;
    
    // Missed visits >2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const missedVisits = patients.filter(p => {
        if (!p.lastVisitDate) return false;
        const lastVisit = new Date(p.lastVisitDate);
        return lastVisit < twoWeeksAgo;
    }).length;
    document.getElementById('stat-missed-visits').textContent = missedVisits;
    
    // Children DBS+
    const dbsPositive = children.filter(c => {
        if (!c.dbsHistory || c.dbsHistory.length === 0) return false;
        return c.dbsHistory.some(test => test.result === 'positive');
    }).length;
    document.getElementById('stat-dbs-positive').textContent = dbsPositive;
}

// ============================================
// ALERTS
// ============================================

function updateAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    const alerts = generateAlerts();
    
    // Update alert count
    document.getElementById('alert-count').textContent = alerts.length;
    
    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-card alert-success p-4 rounded-lg">
                <p class="text-sm text-gray-700" data-en="No alerts at the moment. Everything looks good! 🎉" data-sw="Hakuna tahadhari kwa sasa. Kila kitu ni sawa! 🎉">
                    ${currentLanguage === 'en' ? 'No alerts at the moment. Everything looks good! 🎉' : 'Hakuna tahadhari kwa sasa. Kila kitu ni sawa! 🎉'}
                </p>
            </div>
        `;
        return;
    }
    
    // Generate alert HTML
    let alertsHTML = '';
    alerts.forEach(alert => {
        const alertClass = alert.priority === 'critical' ? 'alert-critical' : 
                          alert.priority === 'warning' ? 'alert-warning' : 'alert-success';
        
        const icon = alert.priority === 'critical' ? '❗' : 
                     alert.priority === 'warning' ? '⚠️' : '✅';
        
        alertsHTML += `
            <div class="${alertClass} alert-card p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow" onclick="handleAlertClick('${alert.patientId}', '${alert.type}')">
                <div class="flex items-start">
                    <div class="text-2xl mr-3">${icon}</div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900">${alert.title}</p>
                        <p class="text-sm text-gray-700 mt-1">${alert.message}</p>
                        ${alert.action ? `<p class="text-xs text-gray-600 mt-2 italic">${currentLanguage === 'en' ? 'Click to view details' : 'Bonyeza kuona maelezo'}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    alertsContainer.innerHTML = alertsHTML;
}

function generateAlerts() {
    const alerts = [];
    const today = new Date();
    
    // Check each patient for alerts
    patients.forEach(patient => {
        // Alert: Missed visit >2 weeks
        if (patient.lastVisitDate) {
            const lastVisit = new Date(patient.lastVisitDate);
            const daysSinceVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
            
            if (daysSinceVisit > 14) {
                alerts.push({
                    priority: 'critical',
                    type: 'missed-visit',
                    patientId: patient.id,
                    title: `${patient.name} - ${currentLanguage === 'en' ? 'Missed Visit' : 'Hakujafika'}`,
                    message: currentLanguage === 'en' 
                        ? `Last visit was ${daysSinceVisit} days ago. Please call!` 
                        : `Ziara ya mwisho ilikuwa siku ${daysSinceVisit} zilizopita. Tafadhali piga simu!`,
                    action: 'view-patient'
                });
            }
        }
        
        // Alert: VL >1000 (needs EAC)
        if (patient.latestVL && patient.latestVL > 1000) {
            const needsEAC = !patient.eac || !patient.eac.started;
            if (needsEAC) {
                alerts.push({
                    priority: 'critical',
                    type: 'high-vl',
                    patientId: patient.id,
                    title: `${patient.name} - ${currentLanguage === 'en' ? 'High Viral Load' : 'Virusi Vingi'}`,
                    message: currentLanguage === 'en'
                        ? `VL: ${patient.latestVL} copies/ml. Start EAC sessions!`
                        : `VL: ${patient.latestVL} copies/ml. Anza vikao vya EAC!`,
                    action: 'view-patient'
                });
            }
        }
        
        // Alert: HVL overdue
        if (patient.nextHVLDate) {
            const nextHVL = new Date(patient.nextHVLDate);
            if (today > nextHVL) {
                const daysOverdue = Math.floor((today - nextHVL) / (1000 * 60 * 60 * 24));
                alerts.push({
                    priority: 'warning',
                    type: 'hvl-overdue',
                    patientId: patient.id,
                    title: `${patient.name} - ${currentLanguage === 'en' ? 'HVL Overdue' : 'HVL Imechelewa'}`,
                    message: currentLanguage === 'en'
                        ? `HVL is ${daysOverdue} days overdue!`
                        : `HVL imechelewa siku ${daysOverdue}!`,
                    action: 'view-patient'
                });
            }
        }
        
        // Alert: CD4 <200 (needs co-trimoxazole and CrAg)
        if (patient.latestCD4 && patient.latestCD4 < 200) {
            if (!patient.onCoTrimoxazole || !patient.crAgTested) {
                alerts.push({
                    priority: 'critical',
                    type: 'low-cd4',
                    patientId: patient.id,
                    title: `${patient.name} - ${currentLanguage === 'en' ? 'Critical CD4' : 'CD4 ya Hatari'}`,
                    message: currentLanguage === 'en'
                        ? `CD4: ${patient.latestCD4}. ${!patient.crAgTested ? 'Do CrAg test! ' : ''}${!patient.onCoTrimoxazole ? 'Start co-trimoxazole!' : ''}`
                        : `CD4: ${patient.latestCD4}. ${!patient.crAgTested ? 'Fanya kipimo cha CrAg! ' : ''}${!patient.onCoTrimoxazole ? 'Anza co-trimoxazole!' : ''}`,
                    action: 'view-patient'
                });
            }
        }
    });
    
    // Check children for alerts
    children.forEach(child => {
        // Alert: DBS due soon
        if (child.nextDBSDate) {
            const nextDBS = new Date(child.nextDBSDate);
            const daysUntilDBS = Math.floor((nextDBS - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDBS >= 0 && daysUntilDBS <= 7) {
                alerts.push({
                    priority: 'warning',
                    type: 'dbs-due',
                    patientId: child.motherId,
                    childId: child.id,
                    title: `${child.name} - ${currentLanguage === 'en' ? 'DBS Due' : 'DBS Inahitajika'}`,
                    message: currentLanguage === 'en'
                        ? `DBS test due in ${daysUntilDBS} days`
                        : `Kipimo cha DBS kinahitajika baada ya siku ${daysUntilDBS}`,
                    action: 'view-child'
                });
            }
        }
        
        // Alert: DBS positive
        if (child.dbsHistory && child.dbsHistory.some(test => test.result === 'positive')) {
            const latestPositive = child.dbsHistory.find(test => test.result === 'positive');
            if (latestPositive && !child.onART) {
                alerts.push({
                    priority: 'critical',
                    type: 'dbs-positive',
                    patientId: child.motherId,
                    childId: child.id,
                    title: `${child.name} - ${currentLanguage === 'en' ? 'DBS Positive!' : 'DBS Positive!'}`,
                    message: currentLanguage === 'en'
                        ? 'Start ART immediately!'
                        : 'Anza dawa za ARV mara moja!',
                    action: 'view-child'
                });
            }
        }
    });
    
    // Sort alerts by priority
    alerts.sort((a, b) => {
        const priorityOrder = { critical: 0, warning: 1, success: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return alerts;
}

function handleAlertClick(patientId, alertType) {
    console.log(`Alert clicked: ${alertType} for patient ${patientId}`);
    // TODO: Navigate to patient details
    alert(`This will open patient details for: ${patientId}\nAlert type: ${alertType}`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'en' ? 'en-GB' : 'sw-TZ');
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function generateUniqueId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// DEMO DATA (for testing)
// ============================================

function loadDemoData() {
    patients = [
        {
            id: generateUniqueId(),
            uniqueCTCID: '1040159066020',
            NHCI: '0159-000020',
            name: 'JELDA LEONARD MELUGA',
            dateOfBirth: '1997-01-14',
            phone: '0620223586',
            address: {
                halmashauri: 'Dodoma',
                kata: 'Miyuji',
                mtaaKijiji: 'Kisasa'
            },
            hivDiagnosisDate: '2025-01-14',
            artStartDate: '2025-10-22',
            latestCD4: 420,
            latestVL: 45,
            lastVisitDate: '2025-10-27',
            nextVisitDate: '2025-11-26',
            onCoTrimoxazole: false,
            crAgTested: true,
            pregnant: false,
            breastfeeding: false
        }
    ];
    
    saveData();
    updateStatistics();
    updateAlerts();
    
    alert(currentLanguage === 'en' 
        ? 'Demo data loaded successfully!' 
        : 'Data ya majaribio imepakiwa kikamilifu!');
}

// Expose loadDemoData for testing
window.loadDemoData = loadDemoData;

console.log('PMTCT System ready!');
console.log('Type "loadDemoData()" in console to load demo data for testing');
