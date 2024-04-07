// Add click event listeners to nickname items
const nicknameItems = document.querySelectorAll('.nickname-item');
nicknameItems.forEach(item => {
    item.addEventListener('click', () => {
        selectNickname(item);
    });
});

// Function to handle nickname selection
function selectNickname(nicknameItem) {
    // Remove the 'selected' class from all items
    const nicknameItems = document.querySelectorAll('.nickname-item');
    nicknameItems.forEach(item => {
        item.classList.remove('selected');
    });

    // Add the 'selected' class to the clicked item
    nicknameItem.classList.add('selected');
}


const togglePanelButton = document.getElementById('activeAccButton');
const sidePanel = document.getElementById('sidePanel');

togglePanelButton.addEventListener('click', () => {
    sidePanel.classList.toggle('retracted');
});



