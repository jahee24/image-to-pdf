import { jsPDF } from 'jspdf';
import { createIcons, FileImage, UploadCloud, Sun, Moon, Trash2, FileType } from 'lucide';

// Initialize Lucide Icons
createIcons({
    icons: {
        FileImage,
        UploadCloud,
        Sun,
        Moon,
        Trash2,
        FileType
    }
});

// App State
let uploadedFiles = [];

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const imageGrid = document.getElementById('image-grid');
const fileCount = document.getElementById('file-count');
const convertBtn = document.getElementById('convert-btn');
const clearAllBtn = document.getElementById('clear-all');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const loader = document.getElementById('loader');

// Theme Management
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    document.body.classList.toggle('light', !isDark);
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
});

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', (e) => handleFiles(e.target.files), false);
dropZone.addEventListener('click', () => {
    fileInput.click();
});

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    // Broaden filter to allow files that might have empty types but are selected via gallery
    const validFiles = Array.from(files).filter(file => {
        return file.type.startsWith('image/') || file.type === '';
    });

    if (validFiles.length === 0 && files.length > 0) {
        console.warn('No valid images found in selection');
        alert('Please select valid image files (JPG, PNG, etc.)');
    }

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const fileData = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                data: reader.result,
                type: file.type || 'image/jpeg' // Fallback for empty type
            };
            uploadedFiles.push(fileData);
            updateUI();
        };
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
        };
    });

    // Reset file input value so that the same file can be selected again
    fileInput.value = "";
}

function updateUI() {
    if (uploadedFiles.length > 0) {
        previewSection.classList.remove('hidden');
    } else {
        previewSection.classList.add('hidden');
    }

    fileCount.textContent = uploadedFiles.length;
    renderGrid();
}

function renderGrid() {
    imageGrid.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <img src="${file.data}" alt="${file.name}">
            <div class="card-overlay">
                <span class="file-name">${truncate(file.name)}</span>
            </div>
            <button class="remove-item" data-id="${file.id}">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
        `;

        card.querySelector('.remove-item').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile(file.id);
        });

        imageGrid.appendChild(card);
    });

    // Refresh icons for dynamically added elements
    createIcons({
        icons: { Trash2 }
    });
}

function removeFile(id) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== id);
    updateUI();
}

clearAllBtn.addEventListener('click', () => {
    uploadedFiles = [];
    updateUI();
});

function truncate(str) {
    return str.length > 20 ? str.substr(0, 17) + '...' : str;
}

// PDF Generation
convertBtn.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) return;

    loader.classList.remove('hidden');

    try {
        const pdf = new jsPDF();

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const img = new Image();
            img.src = file.data;

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Calculate dimensions to fit image without cropping
            const imgWidth = img.width;
            const imgHeight = img.height;

            // Add a new page with the same dimensions as the image
            // Note: jsPDF uses 'pt' (points) by default, or you can specify 'px'
            if (i === 0) {
                // For the first page, we need to set the format in the constructor or use setPage
                // But it's easier to just add a page and delete the first empty one or re-initialize
                pdf.deletePage(1);
            }

            pdf.addPage([imgWidth, imgHeight], imgWidth > imgHeight ? 'l' : 'p');
            pdf.addImage(file.data, file.type.split('/')[1].toUpperCase(), 0, 0, imgWidth, imgHeight);
        }

        pdf.save('converted.pdf');
    } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        loader.classList.add('hidden');
    }
});
