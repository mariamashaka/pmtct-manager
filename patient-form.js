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

function toggleChildFields() {
    const isBreastfeeding = document.querySelector('input[name="breastfeeding"]:checked').value === 'yes';
    const childFields = document.getElementById('child-fields');
    
    if (isBreastfeeding) {
        childFields.classList.remove('hidden');
        document.getElementById('childName').required = true;
        document.getElementById('childDateOfBirth').required = true;
        document.getElementById('childSex').required = true;
        document.getElementById('childRiskLevel').required = true;
    } else {
        childFields.classList.add('hidden');
        document.getElementById('childName').required = false;
        document.getElementById('childDateOfBirth').required = false;
        document.getElementById('childSex').required = false;
        document.getElementById('childRiskLevel').required = false;
        // Clear fields
        document.getElementById('childName').value = '';
        document.getElementById('childDateOfBirth').value = '';
        document.getElementById('childSex').value = '';
        document.getElementById('childHEIDNumber').value = '';
        document.getElementById('childRiskLevel').value = '';
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
        
        // Lab test histories (will be filled during visits)
        cd4History: [],
        hvlHistory: [],
        altHistory: [],
        creatinineHistory: [],
        crAgHistory: [],
        
        // Latest values (for quick access)
        latestCD4: null,
        latestVL: null,
        
        // Therapy (will be determined during first visit)
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
        deliveryDate: null,
        cervicalCancerScreeningDate: null, // Will be set 6 months after delivery
        
        // Visits
        visitHistory: [],
        lastVisitDate: null, // No visit yet, just registration
        nextVisitDate: null, // Will be set during first visit
        
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
    
    // Calculate next HVL date (3 months after ART start)
    const artStart = new Date(formData.artStartDate);
    const nextHVL = new Date(artStart);
    nextHVL.setMonth(nextHVL.getMonth() + 3);
    formData.nextHVLDate = nextHVL.toISOString().split('T')[0];
    
    // If pregnant, calculate cervical cancer screening date (6 months after EDD)
    if (formData.pregnant && formData.expectedDeliveryDate) {
        const edd = new Date(formData.expectedDeliveryDate);
        const screeningDate = new Date(edd);
        screeningDate.setMonth(screeningDate.getMonth() + 6);
        formData.cervicalCancerScreeningDate = screeningDate.toISOString().split('T')[0];
    }
    
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
    }
    
    // Handle child registration if breastfeeding
    let childData = null;
    if (formData.breastfeeding) {
        const childName = document.getElementById('childName').value.trim();
        const childDOB = document.getElementById('childDateOfBirth').value;
        const childSex = document.getElementById('childSex').value;
        const childRisk = document.getElementById('childRiskLevel').value;
        
        if (childName && childDOB && childSex && childRisk) {
            childData = {
                id: generateUniqueId(),
                motherId: formData.id,
                name: childName.toUpperCase(),
                dateOfBirth: childDOB,
                age: calculateChildAge(childDOB),
                sex: childSex,
                heidNumber: document.getElementById('childHEIDNumber').value.trim(),
                riskLevel: childRisk,
                
                // Breastfeeding
                breastfeeding: true,
                breastfeedingStopDate: null,
                
                // Test history
                dbsHistory: [],
                biolineHistory: [],
                
                // Medications
                medications: [],
                onART: false,
                
                // Next tests (calculated based on DOB and risk)
                nextDBSDate: calculateNextDBS(childDOB, childRisk),
                nextBiolineDate: null, // After 12 months if stopped breastfeeding
                
                // Status
                active: true,
                registrationDate: new Date().toISOString().split('T')[0]
            };
            
            // Add child ID to mother's children array
            formData.children.push(childData.id);
        }
    }
    
    // Save patient
    savePatient(formData);
    
    // Save child if exists
    if (childData) {
        saveChild(childData);
    }
    
    // Save facility name for future use
    if (formData.facilityName) {
        localStorage.setItem('pmtct_facility_name', formData.facilityName);
    }
    
    // Show success message and redirect
    showSuccessAndRedirect(formData, childData);
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

function saveChild(childData) {
    // Load existing children
    let children = [];
    const savedChildren = localStorage.getItem('pmtct_children');
    if (savedChildren) {
        children = JSON.parse(savedChildren);
    }
    
    // Add new child
    children.push(childData);
    
    // Save back to localStorage
    localStorage.setItem('pmtct_children', JSON.stringify(children));
    
    console.log('Child saved:', childData.name);
}

function showSuccessAndRedirect(patientData, childData) {
    // Build success message
    let message = currentLanguage === 'en' 
        ? `Patient registered successfully!\n\nName: ${patientData.name}\nCTC ID: ${patientData.uniqueCTCID}`
        : `Mgonjwa amesajiliwa kikamilifu!\n\nJina: ${patientData.name}\nCTC ID: ${patientData.uniqueCTCID}`;
    
    // Add child info if registered
    if (childData) {
        message += '\n\n' + (currentLanguage === 'en' ? '👶 Child Registered:' : '👶 Mtoto Amesajiliwa:');
        message += `\n${childData.name} (${childData.riskLevel === 'high' ? (currentLanguage === 'en' ? 'High Risk' : 'Hatari ya Juu') : (currentLanguage === 'en' ? 'Low Risk' : 'Hatari ya Chini')})`;
    }
    
    // Add important alerts
    const alerts = [];
    
    if (patientData.cervicalCancerScreeningDate) {
        alerts.push(currentLanguage === 'en'
            ? `📅 Cervical cancer screening scheduled for: ${patientData.cervicalCancerScreeningDate}`
            : `📅 Upimaji wa saratani ya mlango wa kizazi umepangwa: ${patientData.cervicalCancerScreeningDate}`);
    }
    
    if (childData && childData.nextDBSDate) {
        alerts.push(currentLanguage === 'en'
            ? `🩸 Next DBS test for ${childData.name}: ${childData.nextDBSDate}`
            : `🩸 Kipimo cha DBS kinachofuata kwa ${childData.name}: ${childData.nextDBSDate}`);
    }
    
    alerts.push(currentLanguage === 'en'
        ? '⚠️ Remember to schedule FIRST VISIT to record initial lab tests!'
        : '⚠️ Kumbuka kupanga ZIARA YA KWANZA kurekodi vipimo vya awali!');
    
    if (alerts.length > 0) {
        message += '\n\n' + (currentLanguage === 'en' ? 'Important:' : 'Muhimu:') + '\n' + alerts.join('\n');
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

function calculateChildAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
        return `${ageInMonths} months`;
    } else {
        const years = Math.floor(ageInMonths / 12);
        const months = ageInMonths % 12;
        if (months === 0) {
            return `${years} year${years > 1 ? 's' : ''}`;
        } else {
            return `${years}y ${months}m`;
        }
    }
}

function calculateNextDBS(birthDate, riskLevel) {
    const birth = new Date(birthDate);
    const today = new Date();
    
    // Calculate age in days
    const ageInDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    
    // DBS schedule:
    // - 72 hours (3 days) - only for high risk
    // - 6 weeks (42 days)
    // - 9 months (270 days)
    
    if (riskLevel === 'high' && ageInDays < 3) {
        // Next DBS: at 72 hours
        const nextDBS = new Date(birth);
        nextDBS.setDate(nextDBS.getDate() + 3);
        return nextDBS.toISOString().split('T')[0];
    } else if (ageInDays < 42) {
        // Next DBS: at 6 weeks
        const nextDBS = new Date(birth);
        nextDBS.setDate(nextDBS.getDate() + 42);
        return nextDBS.toISOString().split('T')[0];
    } else if (ageInDays < 270) {
        // Next DBS: at 9 months
        const nextDBS = new Date(birth);
        nextDBS.setDate(nextDBS.getDate() + 270);
        return nextDBS.toISOString().split('T')[0];
    } else {
        // After 9 months, Bioline tests start (at 12, 15, 18 months)
        // But only after breastfeeding stops
        return null;
    }
}

function calculateNextVisit(date) {
    const nextVisit = new Date(date);
    nextVisit.setMonth(nextVisit.getMonth() + 1); // Default: 1 month
    return nextVisit.toISOString().split('T')[0];
}

console.log('Patient form ready!');
