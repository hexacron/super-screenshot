document.addEventListener('DOMContentLoaded', async () => {
    const captures = await getAllCaptures();
    const grid = document.getElementById('dashboard-grid');
    if (captures.length === 0) {
        grid.innerHTML = '<p>No captures saved yet.</p>';
        return;
    }
    grid.innerHTML = '';

    captures.reverse().forEach(capture => {
        const card = document.createElement('div');
        card.className = 'capture-card';
        card.id = `capture-${capture.id}`;

        // The imageDataUrl is a string and can be used directly.
        const imageUrl = capture.imageDataUrl;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.id = capture.id;
        deleteBtn.innerHTML = '&times;';
        
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
if (confirm('Are you sure you want to delete this capture?')) {
                await deleteCapture(id);
                document.getElementById(`capture-${id}`).remove();
            }
        });

        const link = document.createElement('a');
        link.href = `results.html?id=${capture.id}`;
        link.target = '_blank';
        link.innerHTML = `
            <img src="${imageUrl}" alt="Screenshot thumbnail">
            <div class="card-info">
                <h3>${capture.metadata.title || 'Untitled Capture'}</h3>
                <p>${capture.metadata.captureDate}</p>
            </div>
        `;
        
        card.appendChild(link);
        card.appendChild(deleteBtn);
        grid.appendChild(card);
    });
});