
// Function to fetch list of active accounts from the server
function fetchActiveAccounts() {
    const nicknameListContainer = document.querySelector('#activeAccountsWordCounter');

    // Store the IDs of existing nickname items
    const existingNicknames = new Set(Array.from(nicknameListContainer.querySelectorAll('.account-name')).map(child => child.textContent));


    // Remove any existing nickname items that are no longer present in activeAcc
    nicknameListContainer.querySelectorAll('.account-name').forEach(node => {
        if (!activeAcc.find(account => account.id === node.textContent)) {
            nicknameListContainer.removeChild(node);
        }
    });

    // Add new nickname items for any active accounts that are not already displayed
    activeAcc.forEach(account => {
        if (!existingNicknames.has(account.id)) {
            createAccountSettings(account);
        }
    });
}

// Function to create an account settings form with table headers
function createAccountSettings(account) {
    // Get the container element
    const container = document.getElementById('activeAccountsWordCounter');

    // Create elements for the account settings
    const accountDiv = document.createElement('div');
    accountDiv.classList.add('account');

    // Create a span for the account name
    const accountName = document.createElement('h2');
    accountName.textContent = account.id;
    accountName.classList.add('account-name');

    

    // Add click event listener to toggle word counters list
    accountName.addEventListener('click', () => toggleWordCountersList(accountDiv));

    

    // Create a table for word counters
    const table = document.createElement('table');
    table.classList.add('word-counters-table');

    // Create table headers
    const tableHeaderRow = document.createElement('tr');
    const headers = ['Word to Detect', 'Word to Write', 'Threshold', 'Time Window', 'Repeat', 'Wait', 'Cooldown', 'Actions'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        tableHeaderRow.appendChild(th);
    });

    // Append table headers to the table
    table.appendChild(tableHeaderRow);

    // Create a list to hold the word counters
    const wordCountersList = document.createElement('tbody');
    wordCountersList.classList.add('wordCountersList');

    // Create a list item for the "Add Word Counter" button
    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.classList.add('add-button');
    addButton.addEventListener('click', () => addWordCounter(wordCountersList));
    const listItem = document.createElement('li');
    listItem.appendChild(addButton);
    wordCountersList.appendChild(listItem);

    // Append the word counters list to the table
    table.appendChild(wordCountersList);

    // Append the table to the account div
    accountDiv.appendChild(accountName);
    accountDiv.appendChild(table);

    // Append the account div to the container
    container.appendChild(accountDiv);
}


// Function to toggle the visibility of the word counters list
function toggleWordCountersList(accountDiv) {
    const wordCountersList = accountDiv.querySelector('.wordCountersList');
    wordCountersList.classList.toggle('visible');
}

// Function to add a new word counter to the list
function addWordCounter(wordCountersList) {
    // Create a new table row for the word counter
    const newRow = document.createElement('tr');

    // Add input fields for word detection, word to write, threshold, time window, repeat, wait, and cooldown
    newRow.innerHTML = `
        <td><input type="text" name="wordDetect" placeholder="Word to Detect"></td>
        <td><input type="text" name="wordWrite" placeholder="Word to Write"></td>
        <td><input type="number" name="threshold" value="1" min="1"></td>
        <td><input type="number" name="timeWindow" value="5000" min="0"></td>
        <td><input type="number" name="repeat" value="0" min="0"></td>
        <td><input type="number" name="wait" value="0" min="0"></td>
        <td><input type="number" name="cooldown" value="30000" min="0"></td>
        <td><button class="word-counter-remove">Remove</button></td>
    `;


    // Add event listener to remove button
    const removeButton = newRow.querySelector('.word-counter-remove');
    removeButton.addEventListener('click', () => wordCountersList.removeChild(newRow));

    // Append the new row to the table
    wordCountersList.insertBefore(newRow, wordCountersList.lastElementChild);
}


// Function to create an input field with label
function createInput(type, label) {
    const container = document.createElement('div');

    // Label
    const labelElem = document.createElement('label');
    labelElem.textContent = label;
    container.appendChild(labelElem);

    // Input field
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = label;
    container.appendChild(input);

    return container;
}   

// Function to remove a word counter from the list
function removeWordCounter(listItem) {
    const wordCountersList = listItem.parentNode;
    wordCountersList.removeChild(listItem);
}

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to the "Save" button
    document.getElementById('saveButton').addEventListener('click', saveSettings);
});

// Function to handle saving the settings
function saveSettings() {
    // Get the nickname of the account
    const accountNames = document.querySelectorAll('.account-name');

    // Initialize an array to store the settings for each word counter
    const wordCounterSettings = [];

    // Loop through each account
    accountNames.forEach(accountNameElement => {
        const accountName = accountNameElement.textContent.trim(); // Get the account name
        
        // Find the parent div with the class 'account'
        const accountDiv = accountNameElement.closest('.account');
        
        // Select the table within the account div
        const table = accountDiv.querySelector('.word-counters-table');
        
        if (!table) {
            console.error('Table not found for account:', accountName);
            return;
        }

        // Select all rows in the table
        const rows = table.querySelectorAll('tbody tr');

        // Loop through each row
        rows.forEach((row, index) => {
            // Select input fields in the row
            const wordDetectInput = row.querySelector('input[name="wordDetect"]');
            const wordWriteInput = row.querySelector('input[name="wordWrite"]');
            const thresholdInput = row.querySelector('input[name="threshold"]');
            const timeWindowInput = row.querySelector('input[name="timeWindow"]');
            const repeatInput = row.querySelector('input[name="repeat"]');
            const waitInput = row.querySelector('input[name="wait"]');
            const cooldownInput = row.querySelector('input[name="cooldown"]');

            // Check if any of the input fields are null
            if (!wordDetectInput || !wordWriteInput || !thresholdInput || !timeWindowInput || !repeatInput || !waitInput || !cooldownInput) {
                console.error(`One or more input fields are null in row ${index + 1} of account ${accountName}.`);
                return;
            }

            // Create an object with the settings for this word counter
            const counterSettings = {
                nickname: accountName,
                word_detect: wordDetectInput.value,
                word_write: wordWriteInput.value,
                threshold: parseInt(thresholdInput.value),
                timeWindow: parseInt(timeWindowInput.value),
                repeat: parseInt(repeatInput.value),
                wait: parseInt(waitInput.value),
                cooldown: parseInt(cooldownInput.value)
            };

            // Push the settings object to the array
            wordCounterSettings.push(counterSettings);
        });
    });

    // Print the word counter settings
    console.log(wordCounterSettings);



    // Construct the payload to send to the server
    const payload = {
        word_counters: wordCounterSettings
    };

    // Send the payload to the server using fetch
    fetch('/connectWordCounters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save settings');
        }
        return response.json();
    })
    .then(data => {
        console.log('Settings saved successfully:', data);
    })
    .catch(error => {
        console.error('Error saving settings:', error);
    });
}