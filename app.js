const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const createFolderButton = document.getElementById('createFolderButton');
const showFilesButton = document.getElementById('showFilesButton');
const fileList = document.getElementById('fileList');
const progressContainer = document.getElementById('progressContainer');
const uploadProgress = document.getElementById('uploadProgress');
const progressText = document.getElementById('progressText');

// Upload file
uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (file) {
        progressContainer.style.display = 'flex'; // Show progress bar
        const fileRef = window.firebaseStorageRef(window.firebaseStorage, file.name);
        const uploadTask = window.firebaseUploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.value = progress;
                progressText.innerText = `${Math.round(progress)}%`;
            }, 
            (error) => {
                alert('Upload failed: ' + error.message);
                progressContainer.style.display = 'none';
            }, 
            () => {
                alert('Upload successful!');
                progressContainer.style.display = 'none';
                listFiles(); // Refresh file list
            }
        );
    } else {
        alert('Please select a file to upload.');
    }
});

// Create folder
createFolderButton.addEventListener('click', async () => {
    const folderName = prompt('Enter new folder name:');
    if (folderName) {
        const folderRef = window.firebaseStorageRef(window.firebaseStorage, folderName + '/');
        await window.firebaseUploadBytesResumable(folderRef, new Blob([])).then(() => {
            alert('Folder created successfully!');
        }).catch((error) => {
            alert('Failed to create folder: ' + error.message);
        });
    } else {
        alert('Folder name cannot be empty.');
    }
});

// Show uploaded files
showFilesButton.addEventListener('click', async () => {
    const folderName = prompt('Enter folder name (or leave blank for root):');
    const folderRef = window.firebaseStorageRef(window.firebaseStorage, folderName || '');
    window.firebaseListAll(folderRef).then((res) => {
        fileList.innerHTML = '';
        fileList.style.display = 'block';
        res.items.forEach((itemRef) => {
            window.firebaseGetDownloadURL(itemRef).then((url) => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('fileItem');
                fileItem.innerHTML = `
                    <a href="${url}" target="_blank">${itemRef.name}</a>
                    <button class="downloadButton" data-url="${url}">Download</button>
                    <button class="viewButton" data-url="${url}">View</button>
                    <button class="deleteButton" data-ref="${itemRef.fullPath}">Delete</button>
                    <button class="shareButton" data-url="${url}">Share</button>
                `;
                fileList.appendChild(fileItem);
            });
        });
    }).catch((error) => {
        alert('Failed to retrieve files: ' + error.message);
    });
});

// Handle file actions
fileList.addEventListener('click', (event) => {
    if (event.target.classList.contains('downloadButton')) {
        const url = event.target.getAttribute('data-url');
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        a.click();
    } else if (event.target.classList.contains('viewButton')) {
        const url = event.target.getAttribute('data-url');
        window.open(url, '_blank');
    } else if (event.target.classList.contains('deleteButton')) {
        const fileRefPath = event.target.getAttribute('data-ref');
        const fileRef = window.firebaseStorageRef(window.firebaseStorage, fileRefPath);
        window.firebaseDeleteObject(fileRef).then(() => {
            alert('File deleted successfully!');
            event.target.parentElement.remove();
        }).catch((error) => {
            alert('Failed to delete file: ' + error.message);
        });
    } else if (event.target.classList.contains('shareButton')) {
        const url = event.target.getAttribute('data-url');
        const linkElement = document.createElement('span');
        linkElement.classList.add('shareLink');
        linkElement.textContent = url;
        event.target.parentElement.appendChild(linkElement);
    }
});
