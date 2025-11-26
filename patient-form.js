// ============================================
// PATIENT REGISTRATION FORM - JavaScript
// ============================================

let currentLanguage = 'en';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Patient form initialized');
    
    // Load language preference
    const savedLanguage = localStorage.getItem('pmtct_language');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        updateLanguageButtons();
        updateLanguage();
    }
    
    // Set default date to today for lab tests
    const today = new Date().toISOString().split('T')[0];
    
    // Auto-fill facility name if available
    const savedFacility = localStorage.getItem('pmtct_facility_name');
    if (savedFacility) {
        document.getElementById('facilityName').value = savedFacility;
    }
});

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

function changeLanguage(lang) {
    currentLanguage = lang;
    updateLanguageButtons();
    updateLanguage();
    localStorage.setItem('pmtct_language', lang);
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
    // Update all text elements
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

// ============================================
// FORM FUNCTIONALITY
// ============================================

function togglePregnancyFields() {
    const isPregnant = document.querySelector('input[name="pregnant"]:checked').value === 'yes';
    const pregnancyFields = document.getElementById('pregnancy-fields');
    
    if (isPregnant) {
        pregnancyFields.classList.remove('hidden');
        document.getElementById('expectedDeliveryDate').required = true;
    } else {
        pregnancyFields.classList.add('hidden');
        document.getElementById('expectedDeliveryDate').required = false;
        document.getElementById('expectedDeliveryDate').value = '';
    }
}

// ============================================
// FORM SUBMISSION
// ============================================

function handleSubmit(event) {
    event.preventDefault();
    
    // Get all form data
    const formData = {
        // Basic info
        id: generateUniqueId(),
        name: document.getElementById('fullName').value.trim().toUpperCase(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        age: calculateAge(document.getElementById('dateOfBirth').value),
        phone: document.getElementById('phoneNumber').value.trim(),
        sex: document.getElementById('sex').value,
        
        // CTC Registration
        uniqueCTCID: document.getElementById('uniqueCTCID').value.trim(),
        nhci: document.getElementById('nhci').value.trim(),
        facilityName: document.getElementById('facilityName').value.trim(),
        
        // Address
        address: {
            halmashauri: document.getElementById('halmashauri').value.trim(),
            tarafa: document.getElementById('tarafa').value.trim(),
            kata: document.getElementById('kata').value.trim(),
            mtaaKijiji: document.getElementById('mtaaKijiji').value.trim(),
            jinaMjumbe: document.getElementById('jinaMjumbe').value.trim(),
            mkuuKaya: document.getElementById('mkuuKaya').value.trim()
        },
        
        // GPS Coordinates (optional)
        coordinates: null,
        
        // HIV Information
        hivDiagnosisDate: document.getElementById('hivDiagnosisDate').value,
        artStartDate: document.getElementById('artStartDate').value,
        whoStage: document.getElementById('whoStage').value,
        currentARV: document.getElementById('arvRegimen').value.trim(),
        
        // Initial Lab Tests
        cd4History: [],
        hvlHistory: [],
        altHistory: [],
        creatinineHistory: [],
        crAgHistory: [],
        
        // Latest values (for quick access)
        latestCD4: null,
        latestVL: null,
        
        // Therapy
        onCoTrimoxazole: false,
        onIPT: false,
        iptStartDate: null,
        iptEndDate: null,
        additionalMedications: [],
        
        // EAC
        eac: {
            needed: false,
            started: false,
            startDate: null,
            endDate: null,
            sessions: 0
        },
        
        // Pregnancy
        pregnant: document.querySelector('input[name="pregnant"]:checked').value === 'yes',
        expectedDeliveryDate: document.getElementById('expectedDeliveryDate').value || null,
        breastfeeding: document.querySelector('input[name="breastfeeding"]:checked').value === 'yes',
        delivered: false,
        
        // Visits
        visitHistory: [],
        lastVisitDate: new Date().toISOString().split('T')[0],
        nextVisitDate: calculateNextVisit(new Date()),
        
        // Children
        children: [],
        
        // TB and STI screening
        tbScreeningHistory: [],
        stiScreeningHistory: [],
        
        // Index contacts
        indexContacts: [],
        
        // Status
        active: true,
        registrationDate: new Date().toISOString().split('T')[0]
    };
    
    // Add GPS coordinates if provided
    const latitude = document.getElementById('latitude').value.trim();
    const longitude = document.getElementById('longitude').value.trim();
    if (latitude && longitude) {
        formData.coordinates = {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude)
        };
    }
    
    // Add initial CD4 test
    const cd4Value = document.getElementById('cd4').value;
    if (cd4Value) {
        const cd4Result = parseInt(cd4Value);
        formData.cd4History.push({
            date: new Date().toISOString().split('T')[0],
            result: cd4Result,
            note: 'Initial test at registration'
        });
        formData.latestCD4 = cd4Result;
        
        // Determine if co-trimoxazole needed
        if (cd4Result < 350) {
            formData.onCoTrimoxazole = true;
        }
        
        // Check if CrAg test needed (CD4 <200)
        if (cd4Result < 200) {
            // Will show alert after saving
        }
    }
    
    // Add initial ALT if provided
    const altValue = document.getElementById('alt').value;
    if (altValue) {
        formData.altHistory.push({
            date: new Date().toISOString().split('T')[0],
            result: parseFloat(altValue)
        });
    }
    
    // Add initial Creatinine if provided
    const creatinineValue = document.getElementById('creatinine').value;
    if (creatinineValue) {
        formData.creatinineHistory.push({
            date: new Date().toISOString().split('T')[0],
            result: parseFloat(creatinineValue)
        });
    }
    
    // Calculate next HVL date (3 months after ART start)
    const artStart = new Date(formData.artStartDate);
    const nextHVL = new Date(artStart);
    nextHVL.setMonth(nextHVL.getMonth() + 3);
    formData.nextHVLDate = nextHVL.toISOString().split('T')[0];
    
    // Calculate next CD4 date based on result
    const nextCD4 = new Date();
    if (formData.latestCD4 && formData.latestCD4 < 350) {
        nextCD4.setMonth(nextCD4.getMonth() + 6); // Every 6 months if <350
    } else {
        nextCD4.setFullYear(nextCD4.getFullYear() + 1); // Yearly if >350
    }
    formData.nextCD4Date = nextCD4.toISOString().split('T')[0];
    
    // Determine IPT start date (2 weeks after ART start)
    const iptStart = new Date(artStart);
    iptStart.setDate(iptStart.getDate() + 14);
    
    // Check if IPT should be started now
    const today = new Date();
    if (today >= iptStart) {
        formData.iptStartDate = iptStart.toISOString().split('T')[0];
        const iptEnd = new Date(iptStart);
        iptEnd.setMonth(iptEnd.getMonth() + 3);
        formData.iptEndDate = iptEnd.toISOString().split('T')[0];
        formData.onIPT = true;
    }
    
    // Save to localStorage
    savePatient(formData);
    
    // Save facility name for future use
    if (formData.facilityName) {
        localStorage.setItem('pmtct_facility_name', formData.facilityName);
    }
    
    // Show success message and redirect
    showSuccessAndRedirect(formData);
}

function savePatient(patientData) {
    // Load existing patients
    let patients = [];
    const savedPatients = localStorage.getItem('pmtct_patients');
    if (savedPatients) {
        patients = JSON.parse(savedPatients);
    }
    
    // Add new patient
    patients.push(patientData);
    
    // Save back to localStorage
    localStorage.setItem('pmtct_patients', JSON.stringify(patients));
    
    console.log('Patient saved:', patientData.name);
}

function showSuccessAndRedirect(patientData) {
    // Build success message
    let message = currentLanguage === 'en' 
        ? `Patient registered successfully!\n\nName: ${patientData.name}\nCTC ID: ${patientData.uniqueCTCID}`
        : `Mgonjwa amesajiliwa kikamilifu!\n\nJina: ${patientData.name}\nCTC ID: ${patientData.uniqueCTCID}`;
    
    // Add important alerts
    const alerts = [];
    
    if (patientData.latestCD4 < 200) {
        alerts.push(currentLanguage === 'en' 
            ? '⚠️ CD4 <200: Do CrAg test TODAY!'
            : '⚠️ CD4 <200: Fanya kipimo cha CrAg LEO!');
    }
    
    if (patientData.latestCD4 < 350) {
        alerts.push(currentLanguage === 'en'
            ? '⚠️ CD4 <350: Start co-trimoxazole'
            : '⚠️ CD4 <350: Anza co-trimoxazole');
    }
    
    if (patientData.onIPT) {
        alerts.push(currentLanguage === 'en'
            ? '✅ IPT can be started (2 weeks after ART)'
            : '✅ IPT inaweza kuanzishwa (wiki 2 baada ya ARV)');
    }
    
    if (alerts.length > 0) {
        message += '\n\n' + (currentLanguage === 'en' ? 'Important Actions:' : 'Hatua Muhimu:') + '\n' + alerts.join('\n');
    }
    
    // Show success alert
    alert(message);
    
    // Redirect to dashboard
    window.location.href = 'index.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateUniqueId() {
    return 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

function calculateNextVisit(date) {
    const nextVisit = new Date(date);
    nextVisit.setMonth(nextVisit.getMonth() + 1); // Default: 1 month
    return nextVisit.toISOString().split('T')[0];
}

console.log('Patient form ready!');
