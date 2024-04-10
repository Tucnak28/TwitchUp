let activeAcc = [];

fetch('/loadConfigs') // Make a GET request to the '/configs' endpoint
    .then(response => response.json()) // Parse the JSON response
    .then(configs => {
        // Create the <tbody> element to hold the table rows
        const tbody = document.querySelector('#accountsTable tbody');

        // Loop through the fetched configurations
        configs.forEach((config, index) => {
            // Create a new <tr> element for each configuration
            const accountTr = document.createElement('tr');

            // Create the <td> elements for nickname, token, and button
            const nicknameTd = document.createElement('td');
            const tokenTd = document.createElement('td');
            const buttonTd = document.createElement('td');

            // Create <input> elements for nickname and token and set their attributes
            const nicknameInput = document.createElement('input');
            nicknameInput.setAttribute('type', 'text');
            nicknameInput.setAttribute('id', `Nickname${index + 1}`);
            nicknameInput.setAttribute('name', `Nickname${index + 1}`);
            nicknameInput.value = config.nickname; // Set default value from the configuration

            const tokenInput = document.createElement('input');
            tokenInput.setAttribute('type', 'text');
            tokenInput.setAttribute('id', `Token${index + 1}`);
            tokenInput.setAttribute('name', `Token${index + 1}`);
            tokenInput.value = config.token; // Set default value from the configuration

            // Create a button element for each row
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Toggle'; // Set button text
            toggleButton.setAttribute('type', 'button');
            toggleButton.classList.add('toggle-button'); // Add a class for styling
            toggleButton.dataset.accountId = config.nickname; // Set data attribute to identify the account

            // Add click event listener to toggle button
            toggleButton.addEventListener('click', function() {
                const accountId = this.dataset.accountId;
                toggleAccountConnection(accountId, toggleButton);
            });

            // Append the <input> elements to the corresponding <td> elements
            nicknameTd.appendChild(nicknameInput);
            tokenTd.appendChild(tokenInput);

            // Append the toggle button to the button <td> element
            buttonTd.appendChild(toggleButton);

            // Append the <td> elements to the <tr> element
            accountTr.appendChild(nicknameTd);
            accountTr.appendChild(tokenTd);
            accountTr.appendChild(buttonTd);

            // Append the <tr> element to the <tbody> of the table
            tbody.appendChild(accountTr);
        });
    })
    .catch(error => {
        console.error('Error fetching IRC configs:', error);
    });

// Function to toggle the connection status of an account
function toggleAccountConnection(accountId, button) {
    fetch(`/toggleConnection/${accountId}`, { method: 'POST' })
    .then(response => {
        if (response.ok) {
            // Toggle the CSS class based on the button's current state
            button.classList.toggle('on');


            showToast('Success', 'Account connection status updated successfully', 'green');
        } else {
            console.error('Failed to update account connection status');
            showToast('Error', 'Failed to update account connection status', 'red');
        }
    })
    .catch(error => {
        console.error('Error updating account connection status:', error);
        showToast('Error', 'Error updating account connection status', 'red');
    });
}



function saveAccounts() {
    // Select all input elements inside the table body
    const inputElements = document.querySelectorAll('#accountsTable tbody input[type="text"]');

    // Initialize an array to store the account information
    const accounts = [];

    // Loop through each input element (assuming each row represents an account)
    for (let i = 0; i < inputElements.length; i += 2) {
        // Get the nickname and token values from the input elements
        const nickname = inputElements[i].value;
        const token = inputElements[i + 1].value;

        // Push an object representing the account into the accounts array
        accounts.push({ nickname, token });
    }

    fetch('/saveConfigs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(accounts)
    })
    .then(response => {
        if (response.ok) {
            // Show toast notification upon successful save
            showToast('Success', 'Accounts saved successfully', 'green');
        } else {
            console.error('Failed to save accounts');
            showToast('Error', 'Failed to save accounts', 'red');
        }
    })
    .catch(error => {
        console.error('Error saving accounts:', error);
        showToast('Error', 'Error saving accounts', 'red');
    });
}

function populateNickPanel() {
    const nicknameListContainer =  document.querySelector('#nicknameListContainer');

    while (nicknameListContainer.firstChild) {
        nicknameListContainer.removeChild(nicknameListContainer.firstChild);
    }
    
    activeAcc.forEach(account => {
        const accountDiv = document.createElement('div');

        accountDiv.className = "nickname-item";
        accountDiv.innerHTML = account.id;
    
        nicknameListContainer.appendChild(accountDiv);
    });
}




// Function to fetch and check connections
function checkConnections() {
    fetch('/checkConnections')
        .then(response => {
            if (response.ok) {
                console.log('Connections checked successfully');
                // Parse the JSON response if needed
                return response.json();
            } else {
                console.error('Failed to check connections');
                throw new Error('Failed to check connections');
            }
        })
        .then(data => {
            // Process the data if needed
            console.log(data);
            activeAcc = data;
            populateNickPanel();
        })
        .catch(error => {
            console.error('Error checking connections:', error);
        });
}

// Call the function initially
//checkConnections();

// Set up periodic fetching every 10 seconds (10000 milliseconds)
const intervalId = setInterval(checkConnections, 1000);
    

// To stop the periodic fetching, you can use clearInterval with the intervalId:
// clearInterval(intervalId);

