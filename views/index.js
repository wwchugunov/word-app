function showInstruction() {
    Swal.fire({
        title: 'Інструкція по підготовці файлу',
        html: `
            <div style="text-align: center;">
                <h3>Формат файлу</h3>
                <p>Файл зберігати виключно у форматі <strong>CSV (Разделители - запятые)</strong>.</p>
                <img src="/formatfile.jpg" alt="Інструкція" style="max-width: 80%; height: auto; margin-bottom: 20px;">
            </div>

            <hr style="border-top: 2px solid #ccc;">

            <div style="text-align: center;">
                <h3>Вибір формату в Excel</h3>
                <p>У разі якщо <span>Excel</span> пропонує щось форматувати або видалити  натискаємо <strong>Нет</strong></p>
                <img src="/addinfophoti.jpg" alt="Інструкція" style="max-width: 80%; height: auto; margin-bottom: 20px;">
            </div>

            <hr style="border-top: 2px solid #ccc;">

            <div style="text-align: center;">
                <h3>Формат таблиці</h3>
                <p>У файлі має бути виключно таблиця, без додаткових описів або заголовків тощо</p>
                <img src="/ekcel.jpg" alt="Інструкція" style="max-width: 80%; height: auto; margin-bottom: 20px;">
            </div>
        `,
        showCloseButton: true,
        confirmButtonText: 'Закрити',
        customClass: {
            popup: 'custom-popup', 
        },
        didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.width = '80%';
            popup.style.maxWidth = 'none'; 
        }
    });
}



function updateFileName(inputId) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    const buttonTextElement = document.getElementById(inputId + 'ButtonText');
    const buttonElement = document.getElementById(inputId + 'Button');

    if (file) {
        buttonTextElement.textContent = file.name; 
        buttonElement.classList.add('file-selected'); 
        buttonTextElement.style.color = 'black'; 
    } else {
        buttonTextElement.textContent = inputId === 'registry' ? 'Реєстр' : 'Запит партнера';
        buttonElement.classList.remove('file-selected'); 
        buttonTextElement.style.color = ''; 
    }
}



function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.add('dragover');
}

function handleDrop(event, inputId) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('dragover');

    const input = document.getElementById(inputId);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        input.files = files;
        updateFileName(inputId);
    }
}


function showReport(data, type) {
    const unmatchedList = data.unmatched
        .filter(item => item.name)
        .map(item => `<li>${item.name}</li>`);

    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < unmatchedList.length; i += chunkSize) {
        chunks.push(unmatchedList.slice(i, i + chunkSize));
    }

    const columns = chunks
        .map(chunk => `<ul class="column">${chunk.join('')}</ul>`)
        .join('');

    if (unmatchedList.length > 0) {
        Swal.fire({
            icon: 'info',
            title: 'Звіт обробки',
            html: `
                <h4>Не знайдено:</h4>
                <div class="columns">${columns}</div>
            `,
            confirmButtonText: 'Завантажити файли',
            customClass: {
                popup: 'custom-popup',
            }
        }).then((result) => {

            if (result.isConfirmed) {
                downloadFiles(type);
            }
        });
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Звіт обробки',
            html: `<h4>Усі дані знайдено!</h4>`,
            confirmButtonText: 'Завантажити файли',
            customClass: {
                popup: 'custom-popup',
            }
        }).then((result) => {

            if (result.isConfirmed) {
                downloadFiles(type);
            }
        });
    }
}




function downloadFiles(type) {
    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);
    const queryParams = new URLSearchParams({ type });

    Swal.fire({
        title: 'Завантаження...',
        text: 'Файли формуються, будь ласка, зачекайте.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    fetch(`http://localhost:1515/upload/?${queryParams.toString()}`, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка при завантаженні файлу');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'documents.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            Swal.close();
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Помилка',
                text: `Не вдалося завантажити файл: ${err.message}`,
            });
        });
}

function submitForm(type) {
    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);
    const queryParams = new URLSearchParams({ type, report: 'true' });

    Swal.fire({
        title: 'Формування...',
        text: 'Будь ласка, зачекайте, поки триває формування даних.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    fetch(`http://localhost:1515/upload/?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка обробки даних');
            }
            return response.json();
        })
        .then(data => {
            Swal.close(); 

            showReport(data, type);
        })
        .catch(err => {
            Swal.close(); 

            Swal.fire({
                icon: 'error',
                title: 'Помилка',
                text: `Сталася помилка: ${err.message}`,
            });
        });
}


function updateDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('uk-UA', options);
}




updateDateTime();
setInterval(updateDateTime, 60000); 
