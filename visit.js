// ============================================
// PATIENT VISIT SCREEN - Complete Logic
// ============================================

let currentLanguage = 'en';
let currentPatient = null;
let currentChildren = [];
let visitData = {
    date: new Date().toISOString().split('T')[0],
    weight: null,
    tbScreening: false,
    stiScreening: false,
    arvDispensed: false,
    arvDays: 30,
    testsPerformed: []
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Visit screen initialized');
    
    // Load language preference
    const savedLanguage = localStorage.getItem('pmtct_language');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        updateLanguageButtons();
        updateLanguage();
    }
    
    // Get patient ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    
    if (patientId) {
        loadPatient(patientId);
    } else {
        alert('No patient selected');
        window.location.href = 'index.html';
    }
});

// ============================================
// LOAD PATIENT DATA
// ============================================

function loadPatient(patientId) {
    // Load patients from localStorage
    const savedPatients = localStorage.getItem('pmtct_patients');
    if (!savedPatients) {
        alert('No patients found');
        window.location.href = 'index.html';
        return;
    }
    
    const patients = JSON.parse(savedPatients);
    currentPatient = patients.find(p => p.id === patientId);
    
    if (!currentPatient) {
        alert('Patient not found');
        window.location.href = 'index.html';
        return;
    }
    
    // Load children if any
    if (currentPatient.children && currentPatient.children.length > 0) {
        const savedChildren = localStorage.getItem('pmtct_children');
        if (savedChildren) {
            const allChildren = JSON.parse(savedChildren);
            currentChildren = allChildren.filter(c => currentPatient.children.includes(c.id));
        }
    }
    
    // Display patient info
    displayPatientInfo();
    
    // Generate alerts
    generateAlerts();
    
    // Display current medications
    displayMedications();
    
    // Display children if any
    if (currentChildren.length > 0) {
        displayChildren();
    }
    
    // Hide loading, show content
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('visit-content').classList.remove('hidden');
}

function displayPatientInfo() {
    document.getElementById('patient-name').textContent = currentPatient.name;
    
    const lastVisit = currentPatient.lastVisitDate || 'Never';
    const infoText = currentLanguage === 'en'
        ? `CTC ID: ${currentPatient.uniqueCTCID} | Last visit: ${lastVisit}`
        : `CTC ID: ${currentPatient.uniqueCTCID} | Ziara ya mwisho: ${lastVisit}`;
    
    document.getElementById('patient-info').textContent = infoText;
    
    // Display last test results
    document.getElementById('last-cd4').textContent = currentPatient.latestCD4 || '-';
    document.getElementById('next-cd4').textContent = currentPatient.nextCD4Date || '-';
    document.getElementById('last-hvl').textContent = currentPatient.latestVL !== null ? `${currentPatient.latestVL} copies/mL` : '-';
    document.getElementById('next-hvl').textContent = currentPatient.nextHVLDate || '-';
}

// ============================================
// GENERATE ALERTS
// ============================================

function generateAlerts() {
    const alerts = [];
    const today = new Date();
    
    // Check HVL overdue
    if (currentPatient.nextHVLDate) {
        const nextHVL = new Date(currentPatient.nextHVLDate);
        if (today > nextHVL) {
            const daysOverdue = Math.floor((today - nextHVL) / (1000 * 60 * 60 * 24));
            alerts.push({
                priority: 'critical',
                title: currentLanguage === 'en' ? 'HVL Overdue!' : 'HVL Imechelewa!',
                message: currentLanguage === 'en'
                    ? `Viral load test is ${daysOverdue} days overdue. Take sample TODAY!`
                    : `Kipimo cha virusi kimechelewa siku ${daysOverdue}. Chukua sampuli LEO!`,
                action: 'Take HVL sample'
            });
        }
    }
    
    // Check CD4 overdue
    if (currentPatient.nextCD4Date) {
        const nextCD4 = new Date(currentPatient.nextCD4Date);
        if (today > nextCD4) {
            const daysOverdue = Math.floor((today - nextCD4) / (1000 * 60 * 60 * 24));
            alerts.push({
                priority: 'warning',
                title: currentLanguage === 'en' ? 'CD4 Overdue' : 'CD4 Imechelewa',
                message: currentLanguage === 'en'
                    ? `CD4 test is ${daysOverdue} days overdue`
                    : `Kipimo cha CD4 kimechelewa siku ${daysOverdue}`,
                action: 'Take CD4 sample'
            });
        }
    }
    
    // Check if VL >1000 and EAC not started
    if (currentPatient.latestVL && currentPatient.latestVL > 1000) {
        if (!currentPatient.eac || !currentPatient.eac.started) {
            alerts.push({
                priority: 'critical',
                title: currentLanguage === 'en' ? 'High Viral Load!' : 'Virusi Vingi!',
                message: currentLanguage === 'en'
                    ? `VL: ${currentPatient.latestVL} copies/mL. Start EAC sessions immediately!`
                    : `VL: ${currentPatient.latestVL} copies/mL. Anza vikao vya EAC mara moja!`,
                action: 'Start EAC sessions (3 days, every 2 weeks, for 3 months)'
            });
        }
    }
    
    // Check if CD4 <200 and no CrAg test
    if (currentPatient.latestCD4 && currentPatient.latestCD4 < 200) {
        const hasCrAg = currentPatient.crAgHistory && currentPatient.crAgHistory.length > 0;
        if (!hasCrAg) {
            alerts.push({
                priority: 'critical',
                title: currentLanguage === 'en' ? 'Critical CD4!' : 'CD4 ya Hatari!',
                message: currentLanguage === 'en'
                    ? `CD4: ${currentPatient.latestCD4}. Do CrAg test TODAY!`
                    : `CD4: ${currentPatient.latestCD4}. Fanya kipimo cha CrAg LEO!`,
                action: 'Perform CrAg test'
            });
        }
    }
    
    // Check cervical cancer screening
    if (currentPatient.cervicalCancerScreeningDate) {
        const screeningDate = new Date(currentPatient.cervicalCancerScreeningDate);
        const daysUntil = Math.floor((screeningDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 30) {
            alerts.push({
                priority: 'info',
                title: currentLanguage === 'en' ? 'Cervical Cancer Screening Due' : 'Upimaji wa Saratani Unahitajika',
                message: currentLanguage === 'en'
                    ? `Screening due in ${daysUntil} days (${currentPatient.cervicalCancerScreeningDate})`
                    : `Upimaji unahitajika baada ya siku ${daysUntil} (${currentPatient.cervicalCancerScreeningDate})`,
                action: 'Schedule screening'
            });
        }
    }
    
    // Check children DBS tests
    currentChildren.forEach(child => {
        if (child.nextDBSDate) {
            const nextDBS = new Date(child.nextDBSDate);
            const daysUntil = Math.floor((nextDBS - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil < 0) {
                alerts.push({
                    priority: 'critical',
                    title: `${child.name} - DBS ${currentLanguage === 'en' ? 'Overdue!' : 'Imechelewa!'}`,
                    message: currentLanguage === 'en'
                        ? `DBS test is ${Math.abs(daysUntil)} days overdue`
                        : `Kipimo cha DBS kimechelewa siku ${Math.abs(daysUntil)}`,
                    action: 'Take DBS sample'
                });
            } else if (daysUntil <= 7) {
                alerts.push({
                    priority: 'warning',
                    title: `${child.name} - DBS ${currentLanguage === 'en' ? 'Due Soon' : 'Karibu'}`,
                    message: currentLanguage === 'en'
                        ? `DBS test due in ${daysUntil} days`
                        : `Kipimo cha DBS kinahitajika baada ya siku ${daysUntil}`,
                    action: 'Prepare for DBS test'
                });
            }
        }
    });
    
    // Display alerts
    displayAlerts(alerts);
}

function displayAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="alert-success p-4 rounded-lg">
                <p class="text-sm text-gray-700">
                    ${currentLanguage === 'en' ? '✅ No urgent alerts. Everything is on track!' : '✅ Hakuna tahadhari za haraka. Kila kitu ni sawa!'}
                </p>
            </div>
        `;
        return;
    }
    
    // Sort by priority
    alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2, success: 3 };
        return priority[a.priority] - priority[b.priority];
    });
    
    let html = '';
    alerts.forEach(alert => {
        const icon = alert.priority === 'critical' ? '❗' :
                     alert.priority === 'warning' ? '⚠️' :
                     alert.priority === 'info' ? 'ℹ️' : '✅';
        
        const alertClass = `alert-${alert.priority}`;
        
        html += `
            <div class="${alertClass} p-4 rounded-lg mb-3">
                <div class="flex items-start">
                    <div class="text-2xl mr-3">${icon}</div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900">${alert.title}</p>
                        <p class="text-sm text-gray-700 mt-1">${alert.message}</p>
                        ${alert.action ? `<p class="text-xs text-gray-600 mt-2 font-medium">→ ${alert.action}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// SAVE LAB RESULTS - CD4
// ============================================

function saveCD4() {
    const cd4Input = document.getElementById('cd4-input');
    const cd4Value = parseInt(cd4Input.value);
    
    if (!cd4Value || cd4Value < 0) {
        alert(currentLanguage === 'en' ? 'Please enter a valid CD4 count' : 'Tafadhali ingiza CD4 sahihi');
        return;
    }
    
    // Add to history
    if (!currentPatient.cd4History) currentPatient.cd4History = [];
    currentPatient.cd4History.push({
        date: visitData.date,
        result: cd4Value,
        note: ''
    });
    
    // Update latest
    currentPatient.latestCD4 = cd4Value;
    
    // Generate recommendations
    const recommendations = generateCD4Recommendations(cd4Value);
    
    // Display recommendations
    displayRecommendation('cd4-recommendation', recommendations);
    
    // Update next CD4 date
    const nextCD4 = new Date(visitData.date);
    if (cd4Value < 350) {
        nextCD4.setMonth(nextCD4.getMonth() + 6); // Every 6 months
    } else {
        nextCD4.setFullYear(nextCD4.getFullYear() + 1); // Yearly
    }
    currentPatient.nextCD4Date = nextCD4.toISOString().split('T')[0];
    
    // Update display
    document.getElementById('last-cd4').textContent = cd4Value;
    document.getElementById('next-cd4').textContent = currentPatient.nextCD4Date;
    
    // Clear input
    cd4Input.value = '';
    
    // Add to visit data
    visitData.testsPerformed.push({ test: 'CD4', result: cd4Value });
    
    // Save patient
    savePatientData();
    
    // Regenerate alerts
    generateAlerts();
}

function generateCD4Recommendations(cd4Value) {
    const recommendations = [];
    
    if (cd4Value < 200) {
        recommendations.push({
            priority: 'critical',
            title: currentLanguage === 'en' ? '🚨 CRITICAL CD4!' : '🚨 CD4 YA HATARI!',
            messages: [
                currentLanguage === 'en' 
                    ? 'CD4 <200 cells/μL - Very low!' 
                    : 'CD4 <200 cells/μL - Chini sana!',
                currentLanguage === 'en'
                    ? '1. Perform CrAg test TODAY'
                    : '1. Fanya kipimo cha CrAg LEO',
                currentLanguage === 'en'
                    ? '2. Start co-trimoxazole 960mg OD'
                    : '2. Anza co-trimoxazole 960mg OD',
                currentLanguage === 'en'
                    ? '3. Monitor closely for opportunistic infections'
                    : '3. Fuatilia kwa karibu magonjwa ya ufuasi',
                currentLanguage === 'en'
                    ? `4. Next CD4: ${currentPatient.nextCD4Date} (6 months)`
                    : `4. CD4 inayofuata: ${currentPatient.nextCD4Date} (miezi 6)`
            ]
        });
        
        // Update patient medications
        currentPatient.onCoTrimoxazole = true;
        
    } else if (cd4Value >= 200 && cd4Value < 350) {
        recommendations.push({
            priority: 'warning',
            title: currentLanguage === 'en' ? '⚠️ Low CD4' : '⚠️ CD4 Chini',
            messages: [
                currentLanguage === 'en'
                    ? 'CD4 200-350 cells/μL - Below normal'
                    : 'CD4 200-350 cells/μL - Chini ya kawaida',
                currentLanguage === 'en'
                    ? '1. Start co-trimoxazole 960mg OD'
                    : '1. Anza co-trimoxazole 960mg OD',
                currentLanguage === 'en'
                    ? '2. Check adherence to ARV'
                    : '2. Angalia ufuatiliaji wa ARV',
                currentLanguage === 'en'
                    ? `3. Next CD4: ${currentPatient.nextCD4Date} (6 months)`
                    : `3. CD4 inayofuata: ${currentPatient.nextCD4Date} (miezi 6)`
            ]
        });
        
        currentPatient.onCoTrimoxazole = true;
        
    } else {
        recommendations.push({
            priority: 'success',
            title: currentLanguage === 'en' ? '✅ Good CD4!' : '✅ CD4 Nzuri!',
            messages: [
                currentLanguage === 'en'
                    ? 'CD4 >350 cells/μL - Normal range!'
                    : 'CD4 >350 cells/μL - Kiwango cha kawaida!',
                currentLanguage === 'en'
                    ? '1. Co-trimoxazole NOT needed (can stop if currently taking)'
                    : '1. Co-trimoxazole HAIHITAJIKI (unaweza kuacha ikiwa unakunywa)',
                currentLanguage === 'en'
                    ? '2. Continue ARV as prescribed'
                    : '2. Endelea na ARV kama ilivyoelezwa',
                currentLanguage === 'en'
                    ? `3. Next CD4: ${currentPatient.nextCD4Date} (12 months)`
                    : `3. CD4 inayofuata: ${currentPatient.nextCD4Date} (miezi 12)`
            ]
        });
        
        currentPatient.onCoTrimoxazole = false;
    }
    
    return recommendations;
}

// ============================================
// SAVE LAB RESULTS - HVL
// ============================================

function saveHVL() {
    const hvlInput = document.getElementById('hvl-input');
    const hvlValue = parseInt(hvlInput.value);
    
    if (hvlValue === null || hvlValue === undefined || hvlValue < 0) {
        alert(currentLanguage === 'en' ? 'Please enter a valid viral load' : 'Tafadhali ingiza virusi sahihi');
        return;
    }
    
    // Add to history
    if (!currentPatient.hvlHistory) currentPatient.hvlHistory = [];
    currentPatient.hvlHistory.push({
        date: visitData.date,
        result: hvlValue,
        note: ''
    });
    
    // Update latest
    currentPatient.latestVL = hvlValue;
    
    // Generate recommendations
    const recommendations = generateHVLRecommendations(hvlValue);
    
    // Display recommendations
    displayRecommendation('hvl-recommendation', recommendations);
    
    // Update next HVL date
    const nextHVL = new Date(visitData.date);
    if (hvlValue > 1000) {
        nextHVL.setMonth(nextHVL.getMonth() + 3); // Every 3 months if high
    } else {
        nextHVL.setMonth(nextHVL.getMonth() + 6); // Every 6 months if suppressed
    }
    currentPatient.nextHVLDate = nextHVL.toISOString().split('T')[0];
    
    // Update display
    document.getElementById('last-hvl').textContent = `${hvlValue} copies/mL`;
    document.getElementById('next-hvl').textContent = currentPatient.nextHVLDate;
    
    // Clear input
    hvlInput.value = '';
    
    // Add to visit data
    visitData.testsPerformed.push({ test: 'HVL', result: hvlValue });
    
    // Save patient
    savePatientData();
    
    // Regenerate alerts
    generateAlerts();
}

function generateHVLRecommendations(hvlValue) {
    const recommendations = [];
    
    if (hvlValue < 50) {
        recommendations.push({
            priority: 'success',
            title: currentLanguage === 'en' ? '✅ Excellent! Virus Undetectable' : '✅ Bora Sana! Virusi Haionekani',
            messages: [
                currentLanguage === 'en'
                    ? 'VL <50 copies/mL - Virus suppressed!'
                    : 'VL <50 copies/mL - Virusi imezuiliwa!',
                currentLanguage === 'en'
                    ? '1. Continue ARV as prescribed'
                    : '1. Endelea na ARV kama ilivyoelezwa',
                currentLanguage === 'en'
                    ? '2. Good adherence - keep it up!'
                    : '2. Ufuatiliaji mzuri - endelea hivyo!',
                currentLanguage === 'en'
                    ? `3. Next HVL: ${currentPatient.nextHVLDate} (6 months)`
                    : `3. HVL inayofuata: ${currentPatient.nextHVLDate} (miezi 6)`
            ]
        });
        
    } else if (hvlValue >= 50 && hvlValue <= 1000) {
        recommendations.push({
            priority: 'warning',
            title: currentLanguage === 'en' ? '⚠️ Virus Detectable' : '⚠️ Virusi Inaonekana',
            messages: [
                currentLanguage === 'en'
                    ? 'VL 50-1000 copies/mL - Low but detectable'
                    : 'VL 50-1000 copies/mL - Chini lakini inaonekana',
                currentLanguage === 'en'
                    ? '1. Check adherence to ARV - are doses being missed?'
                    : '1. Angalia ufuatiliaji wa ARV - je unakosa kipimo?',
                currentLanguage === 'en'
                    ? '2. Counsel patient on importance of adherence'
                    : '2. Mshauri mgonjwa kuhusu umuhimu wa ufuatiliaji',
                currentLanguage === 'en'
                    ? `3. Repeat HVL in 3 months: ${currentPatient.nextHVLDate}`
                    : `3. Rudia HVL baada ya miezi 3: ${currentPatient.nextHVLDate}`
            ]
        });
        
    } else {
        recommendations.push({
            priority: 'critical',
            title: currentLanguage === 'en' ? '🚨 HIGH VIRAL LOAD!' : '🚨 VIRUSI VINGI!',
            messages: [
                currentLanguage === 'en'
                    ? `VL >1000 copies/mL (${hvlValue}) - Treatment failure risk!`
                    : `VL >1000 copies/mL (${hvlValue}) - Hatari ya kushindwa matibabu!`,
                currentLanguage === 'en'
                    ? '1. START EAC SESSIONS IMMEDIATELY:'
                    : '1. ANZA VIKAO VYA EAC MARA MOJA:',
                currentLanguage === 'en'
                    ? '   → 3 days in a row'
                    : '   → Siku 3 mfululizo',
                currentLanguage === 'en'
                    ? '   → Repeat every 2 weeks'
                    : '   → Rudia kila wiki 2',
                currentLanguage === 'en'
                    ? '   → Continue for 3 months total'
                    : '   → Endelea kwa miezi 3 jumla',
                currentLanguage === 'en'
                    ? '2. Investigate reasons for poor adherence'
                    : '2. Chunguza sababu za ufuatiliaji mbaya',
                currentLanguage === 'en'
                    ? `3. Repeat HVL in 3 months: ${currentPatient.nextHVLDate}`
                    : `3. Rudia HVL baada ya miezi 3: ${currentPatient.nextHVLDate}`
            ]
        });
        
        // Start EAC
        if (!currentPatient.eac) currentPatient.eac = {};
        currentPatient.eac.needed = true;
        currentPatient.eac.started = true;
        currentPatient.eac.startDate = visitData.date;
        
        const eacEnd = new Date(visitData.date);
        eacEnd.setMonth(eacEnd.getMonth() + 3);
        currentPatient.eac.endDate = eacEnd.toISOString().split('T')[0];
        currentPatient.eac.sessions = 0;
    }
    
    return recommendations;
}

// ============================================
// SAVE OTHER TESTS
// ============================================

function saveCrAg() {
    const cragInput = document.getElementById('crag-input');
    const cragValue = cragInput.value;
    
    if (!cragValue) {
        alert(currentLanguage === 'en' ? 'Please select CrAg result' : 'Tafadhali chagua matokeo ya CrAg');
        return;
    }
    
    // Add to history
    if (!currentPatient.crAgHistory) currentPatient.crAgHistory = [];
    currentPatient.crAgHistory.push({
        date: visitData.date,
        result: cragValue,
        note: ''
    });
    
    // Generate recommendations
    const recommendations = [];
    
    if (cragValue === 'positive') {
        recommendations.push({
            priority: 'critical',
            title: currentLanguage === 'en' ? '🚨 CrAg POSITIVE!' : '🚨 CrAg POSITIVE!',
            messages: [
                currentLanguage === 'en'
                    ? 'Cryptococcal antigen detected!'
                    : 'Antigens ya cryptococcal zimegunduliwa!',
                currentLanguage === 'en'
                    ? '1. Do lumbar puncture to check CSF'
                    : '1. Fanya lumbar puncture kuangalia CSF',
                currentLanguage === 'en'
                    ? '2. If CSF normal: Start Fluconazole 800mg for 2 weeks'
                    : '2. Kama CSF kawaida: Anza Fluconazole 800mg kwa wiki 2',
                currentLanguage === 'en'
                    ? '3. Then Fluconazole 400mg for 8 weeks'
                    : '3. Kisha Fluconazole 400mg kwa wiki 8',
                currentLanguage === 'en'
                    ? '4. Then Fluconazole 200mg for 1 year'
                    : '4. Kisha Fluconazole 200mg kwa mwaka 1'
            ]
        });
    } else {
        recommendations.push({
            priority: 'success',
            title: currentLanguage === 'en' ? '✅ CrAg Negative' : '✅ CrAg Negative',
            messages: [
                currentLanguage === 'en'
                    ? 'No cryptococcal infection detected'
                    : 'Hakuna maambukizi ya cryptococcal',
                currentLanguage === 'en'
                    ? 'Continue monitoring CD4'
                    : 'Endelea kufuatilia CD4'
            ]
        });
    }
    
    displayRecommendation('crag-recommendation', recommendations);
    
    // Clear input
    cragInput.value = '';
    
    // Add to visit data
    visitData.testsPerformed.push({ test: 'CrAg', result: cragValue });
    
    savePatientData();
}

function saveALT() {
    const altInput = document.getElementById('alt-input');
    const altValue = parseFloat(altInput.value);
    
    if (!altValue || altValue < 0) return;
    
    if (!currentPatient.altHistory) currentPatient.altHistory = [];
    currentPatient.altHistory.push({
        date: visitData.date,
        result: altValue
    });
    
    altInput.value = '';
    visitData.testsPerformed.push({ test: 'ALT', result: altValue });
    savePatientData();
    
    alert(currentLanguage === 'en' ? 'ALT saved' : 'ALT imehifadhiwa');
}

function saveCreatinine() {
    const creatInput = document.getElementById('creat-input');
    const creatValue = parseFloat(creatInput.value);
    
    if (!creatValue || creatValue < 0) return;
    
    if (!currentPatient.creatinineHistory) currentPatient.creatinineHistory = [];
    currentPatient.creatinineHistory.push({
        date: visitData.date,
        result: creatValue
    });
    
    creatInput.value = '';
    visitData.testsPerformed.push({ test: 'Creatinine', result: creatValue });
    savePatientData();
    
    alert(currentLanguage === 'en' ? 'Creatinine saved' : 'Creatinine imehifadhiwa');
}

// ============================================
// DISPLAY RECOMMENDATIONS
// ============================================

function displayRecommendation(elementId, recommendations) {
    const element = document.getElementById(elementId);
    
    let html = '';
    recommendations.forEach(rec => {
        const recClass = `alert-${rec.priority}`;
        html += `<div class="${recClass} recommendation">`;
        html += `<p class="font-semibold text-gray-900 mb-2">${rec.title}</p>`;
        html += '<ul class="space-y-1">';
        rec.messages.forEach(msg => {
            html += `<li class="text-sm text-gray-700">• ${msg}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    });
    
    element.innerHTML = html;
    element.classList.remove('hidden');
}

// ============================================
// DISPLAY MEDICATIONS
// ============================================

function displayMedications() {
    const container = document.getElementById('medications-list');
    const meds = [];
    
    // ARV (always)
    meds.push({
        name: currentPatient.currentARV || 'TLD',
        dosage: '1 tablet OD',
        status: 'active'
    });
    
    // Co-trimoxazole
    if (currentPatient.onCoTrimoxazole) {
        meds.push({
            name: 'Co-trimoxazole',
            dosage: '960mg OD',
            status: 'active'
        });
    }
    
    // IPT
    if (currentPatient.onIPT) {
        meds.push({
            name: 'Isoniazid (IPT)',
            dosage: '3 tablets OD',
            status: 'active',
            note: currentLanguage === 'en' 
                ? `Started: ${currentPatient.iptStartDate}, Ends: ${currentPatient.iptEndDate}`
                : `Imeanza: ${currentPatient.iptStartDate}, Inamaliza: ${currentPatient.iptEndDate}`
        });
    }
    
    // Additional medications
    if (currentPatient.additionalMedications && currentPatient.additionalMedications.length > 0) {
        currentPatient.additionalMedications.forEach(med => {
            if (med.active) {
                meds.push(med);
            }
        });
    }
    
    let html = '';
    meds.forEach(med => {
        html += `
            <div class="p-3 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-900">${med.name}</p>
                        <p class="text-sm text-gray-600">${med.dosage}</p>
                        ${med.note ? `<p class="text-xs text-gray-500 mt-1">${med.note}</p>` : ''}
                    </div>
                    <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">${currentLanguage === 'en' ? 'Active' : 'Inatumika'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// DISPLAY CHILDREN
// ============================================

function displayChildren() {
    document.getElementById('children-section').classList.remove('hidden');
    const container = document.getElementById('children-list');
    
    let html = '';
    currentChildren.forEach(child => {
        const ageMonths = calculateChildAgeInMonths(child.dateOfBirth);
        const riskBadge = child.riskLevel === 'high' 
            ? '<span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">' + (currentLanguage === 'en' ? 'High Risk' : 'Hatari ya Juu') + '</span>'
            : '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">' + (currentLanguage === 'en' ? 'Low Risk' : 'Hatari ya Chini') + '</span>';
        
        // Determine medications needed
        let childMeds = [];
        
        if (ageMonths < 1.5 && child.riskLevel === 'high') { // < 6 weeks
            childMeds.push('Nevirapine syrup 2.5ml OD');
            childMeds.push('Combivir 60/30 ¼ tab BD');
        } else if (ageMonths < 1.5 && child.riskLevel === 'low') {
            childMeds.push('Nevirapine syrup 2.5ml OD');
        }
        
        if (ageMonths >= 1.5) { // >= 6 weeks
            childMeds.push('Co-trimoxazole 2.5ml OD');
        }
        
        html += `
            <div class="p-4 bg-gray-50 rounded-lg mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${child.name}</p>
                        <p class="text-sm text-gray-600">${currentLanguage === 'en' ? 'Age:' : 'Umri:'} ${child.age || calculateChildAge(child.dateOfBirth)}</p>
                    </div>
                    ${riskBadge}
                </div>
                
                <div class="text-sm text-gray-700 mb-2">
                    <p><strong>${currentLanguage === 'en' ? 'Next DBS:' : 'DBS inayofuata:'}</strong> ${child.nextDBSDate || '-'}</p>
                </div>
                
                <div class="text-sm">
                    <p class="font-semibold text-gray-900 mb-1">${currentLanguage === 'en' ? 'Current Medications:' : 'Dawa za Sasa:'}</p>
                    ${childMeds.length > 0 ? childMeds.map(m => `<p class="text-gray-700">• ${m}</p>`).join('') : '<p class="text-gray-500">' + (currentLanguage === 'en' ? 'None' : 'Hakuna') + '</p>'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function calculateChildAgeInMonths(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
}

function calculateChildAge(birthDate) {
    const months = calculateChildAgeInMonths(birthDate);
    if (months < 12) {
        return `${months} ${currentLanguage === 'en' ? 'months' : 'miezi'}`;
    } else {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
            return `${years} ${currentLanguage === 'en' ? 'year' : 'mwaka'}${years > 1 ? 's' : ''}`;
        } else {
            return `${years}y ${remainingMonths}m`;
        }
    }
}

// ============================================
// COMPLETE VISIT
// ============================================

function completeVisit() {
    // Validate checklist
    const weight = document.querySelector('input[placeholder="kg"]').value;
    const tbDone = document.getElementById('check-tb').checked;
    const stiDone = document.getElementById('check-sti').checked;
    const arvDone = document.getElementById('check-arv').checked;
    
    if (!weight || !tbDone || !stiDone || !arvDone) {
        const missing = [];
        if (!weight) missing.push(currentLanguage === 'en' ? 'Weight' : 'Uzito');
        if (!tbDone) missing.push(currentLanguage === 'en' ? 'TB Screening' : 'Upimaji wa TB');
        if (!stiDone) missing.push(currentLanguage === 'en' ? 'STI Screening' : 'Upimaji wa STI');
        if (!arvDone) missing.push(currentLanguage === 'en' ? 'ARV Dispensed' : 'Dawa za ARV');
        
        const msg = currentLanguage === 'en'
            ? `Please complete: ${missing.join(', ')}`
            : `Tafadhali kamilihaisha: ${missing.join(', ')}`;
        alert(msg);
        return;
    }
    
    // Update visit history
    if (!currentPatient.visitHistory) currentPatient.visitHistory = [];
    currentPatient.visitHistory.push({
        date: visitData.date,
        weight: parseFloat(weight),
        tbScreening: tbDone,
        stiScreening: stiDone,
        arvDispensed: arvDone,
        testsPerformed: visitData.testsPerformed
    });
    
    // Update last visit date
    currentPatient.lastVisitDate = visitData.date;
    
    // Calculate next visit (1 month)
    const nextVisit = new Date(visitData.date);
    nextVisit.setMonth(nextVisit.getMonth() + 1);
    currentPatient.nextVisitDate = nextVisit.toISOString().split('T')[0];
    
    // Save
    savePatientData();
    
    // Success message
    alert(currentLanguage === 'en'
        ? `Visit completed successfully!\n\nNext visit: ${currentPatient.nextVisitDate}`
        : `Ziara imekamilika!\n\nZiara inayofuata: ${currentPatient.nextVisitDate}`);
    
    // Redirect
    window.location.href = 'index.html';
}

// ============================================
// SAVE PATIENT DATA
// ============================================

function savePatientData() {
    const savedPatients = localStorage.getItem('pmtct_patients');
    let patients = savedPatients ? JSON.parse(savedPatients) : [];
    
    const index = patients.findIndex(p => p.id === currentPatient.id);
    if (index !== -1) {
        patients[index] = currentPatient;
    }
    
    localStorage.setItem('pmtct_patients', JSON.stringify(patients));
}

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

function changeLanguage(lang) {
    currentLanguage = lang;
    updateLanguageButtons();
    updateLanguage();
    localStorage.setItem('pmtct_language', lang);
    
    // Regenerate dynamic content
    generateAlerts();
    displayMedications();
    if (currentChildren.length > 0) {
        displayChildren();
    }
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
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(element => {
        if (currentLanguage === 'en') {
            element.textContent = element.getAttribute('data-en');
        } else {
            element.textContent = element.getAttribute('data-sw');
        }
    });
}

console.log('Visit screen ready!');
