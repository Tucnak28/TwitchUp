// Function to fetch list of active accounts from the server
function fetchTipBot() {
    const nicknameListContainer = document.querySelector('#activeAccountsTipBot');

    // Store the IDs of existing nickname items
    const existingNicknames = new Set(Array.from(nicknameListContainer.querySelectorAll('.account-name')).map(child => child.textContent));

    // Remove any existing nickname items that are no longer present in activeAcc
    nicknameListContainer.querySelectorAll('.account-name').forEach(node => {
        if (!activeAcc.find(account => account.id === node.textContent)) {
            const accountDiv = node.closest('.account');
            if (accountDiv) {
                accountDiv.remove();
            }
        }
    });

    // Add new nickname items for any active accounts that are not already displayed
    activeAcc.forEach(account => {
        if (!existingNicknames.has(account.id)) {
            createTipBotToggle(account);
        }
    });
}

// Function to create an account settings form with a toggle button
function createTipBotToggle(account) {
    // Get the container element
    const container = document.getElementById('activeAccountsTipBot');

    // Create elements for the account settings
    const accountDiv = document.createElement('div');
    accountDiv.classList.add('account');

    // Create a span for the account name
    const accountName = document.createElement('h2');
    accountName.textContent = account.id;
    accountName.classList.add('account-name');

    // Create a toggle button to connect/disconnect the TipBot
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connect';
    connectButton.classList.add('toggle-button');
    connectButton.addEventListener('click', () => toggleTipBotConnection(connectButton, account.id));

    // Append elements to the account div
    accountDiv.appendChild(accountName);
    accountDiv.appendChild(connectButton);

    // Append the account div to the container
    container.appendChild(accountDiv);
}

// Function to toggle the TipBot connection for an account
function toggleTipBotConnection(button, accountId) {
    fetch(`/toggleTipBot/${accountId}`, { method: 'POST' })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text(); // This returns a promise containing the text value
    })
    .then(statusText => {
        console.log("Status Text: " + statusText);

        const successMessage = statusText === "Connected" ? 'Account connected successfully' : 'Account disconnected successfully';
        const isSuccess = statusText === "Connected";

        updateConnectionStatus(button, isSuccess);
        showToast(isSuccess ? 'Success' : 'Error', successMessage, isSuccess ? 'green' : 'red');
    })
    .catch(error => {
        console.error('Error updating account connection status:', error);
        showToast('Error', 'Error updating account connection status', 'red');
    });
}

function updateConnectionStatus(button, isSuccess) {
    if (isSuccess) {
        button.classList.add('on');
    } else {
        button.classList.remove('on');
    }
}

document.getElementById("resetTipButton").onclick = () => {
    fetch(`/resetTipBot/`, { method: 'POST' })
    .then(response => {
        if(response.ok) {
            showToast('Success', "Tipbot is in factory state", 'green');
        } else {
            showToast('Error', 'Failed to reset TipBot', 'red');
        }
    })
    .catch(error => {
        console.error('Error resetting TipBot:', error);
        showToast('Error resetting TipBot', 'red');
    });
};
