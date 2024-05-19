/*// Add click event listeners to nickname items
const nicknameItems = document.querySelectorAll('.nickname-item');
nicknameItems.forEach(item => {
    item.addEventListener('click', () => {
        selectNickname(item);
    });
});
*/

let selectedNickname = null; // Variable to store the ID of the selected account

// Function to handle nickname selection
function selectNickname(nicknameItem) {
    // Remove the 'selected' class from all items
    const nicknameItems = document.querySelectorAll('.nickname-item');

    nicknameItems.forEach(item => {
        item.classList.remove('selected');
    });

    

    // Add the 'selected' class to the clicked item
    nicknameItem.classList.add('selected');

    selectedNickname = nicknameItem.textContent;
}


const togglePanelButton = document.getElementById('activeAccButton');
const sidePanel = document.getElementById('sidePanel-right');

togglePanelButton.addEventListener('click', () => {
    sidePanel.classList.toggle('retracted');
});


const channelConnectButton = document.getElementById('channelButton');

channelConnectButton.addEventListener('click', () => {
    const channelInput = document.getElementById('channelInput').value; // Get the value of the input field

    fetch('/reconnectAccounts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channel: channelInput }) // Send the channel input as JSON in the request body
    })
    .then(response => {
        if (response.ok) {
            // Show a success message or perform any other actions upon successful response
            console.log('Accounts reconnected successfully to channel:', channelInput);

            const iframe = document.getElementById("chat-embed");
            iframe.src = `https://www.twitch.tv/embed/${channelInput}/chat?parent=localhost`;
        } else {
            console.error('Failed to reconnect accounts');
            // Handle the failure scenario as needed
        }
    })
    .catch(error => {
        console.error('Error reconnecting accounts:', error);
        // Handle any errors that occur during the request
    });
});


