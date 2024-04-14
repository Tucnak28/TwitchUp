document.addEventListener('DOMContentLoaded', function() {
    // Fetch list of active accounts from the server
    fetchActiveAccounts();
});

// Function to fetch list of active accounts from the server
function fetchActiveAccounts() {
    // Simulated list of active accounts
    //const activeAcc = [{ nickname: 'Account1' }, { nickname: 'Account2' }, { nickname: 'Account3' }];

    // Process the list of active accounts
    activeAcc.forEach(account => {
        // Create and append account settings form
        createAccountSettings(account);
    });
}

// Function to create an account settings form
function createAccountSettings(account) {
    // Get the container element
    const container = document.getElementById('activeAccountsList');

    // Create elements for the account settings
    const accountDiv = document.createElement('div');
    accountDiv.classList.add('account');

    // Create a span for the account name
    const accountName = document.createElement('span');
    accountName.textContent = account.nickname;
    accountName.classList.add('account-name');

    // Add click event listener to toggle word counters list
    accountName.addEventListener('click', () => toggleWordCountersList(accountDiv));

    // Append account name to the account div
    accountDiv.appendChild(accountName);

    // Create a list to hold the word counters
    const wordCountersList = document.createElement('ul');
    wordCountersList.classList.add('wordCountersList');

    // Create a list item for the "Add Word Counter" button
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Word Counter';
    addButton.addEventListener('click', () => addWordCounter(wordCountersList));
    const listItem = document.createElement('li');
    listItem.appendChild(addButton);
    wordCountersList.appendChild(listItem);

    // Append the word counters list to the account div
    accountDiv.appendChild(wordCountersList);

    // Append the account div to the container
    container.appendChild(accountDiv);
}

// Function to toggle the visibility of the word counters list
function toggleWordCountersList(accountDiv) {
    const wordCountersList = accountDiv.querySelector('.wordCountersList');
    wordCountersList.classList.toggle('hidden');
}

function addWordCounter(wordCountersList) {
    // Create a new list item for the word counter
    const listItem = document.createElement('li');

    // Create input fields for word detection, word to write, threshold, time window, repeat, wait, and cooldown
    const wordDetectInput = createInput('text', 'Enter word to detect');
    const wordWriteInput = createInput('text', 'Enter word to write');
    const thresholdInput = createInput('number', 'Threshold', 1);
    const timeWindowInput = createInput('number', 'Time window (ms)', 5000);
    const repeatInput = createInput('number', 'Repeat', 0);
    const waitInput = createInput('number', 'Wait (ms)', 0);
    const cooldownInput = createInput('number', 'Cooldown (ms)', 30000);

    // Create a remove button
    const removeButton = document.createElement('button');
    removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
    <path d="M10.354 4.354a.5.5 0 0 1 0 .708L8.707 8l1.647 1.646a.5.5 0 1 1-.708.708L8 8.707l-1.646 1.647a.5.5 0 1 1-.708-.708L7.293 8 5.646 6.354a.5.5 0 1 1 .708-.708L8 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
  </svg>`;
    removeButton.classList.add('remove-button');
    removeButton.addEventListener('click', () => removeWordCounter(listItem));
    listItem.appendChild(removeButton);

    // Append input fields to the list item
    listItem.appendChild(wordDetectInput);
    listItem.appendChild(wordWriteInput);
    listItem.appendChild(thresholdInput);
    listItem.appendChild(timeWindowInput);
    listItem.appendChild(repeatInput);
    listItem.appendChild(waitInput);
    listItem.appendChild(cooldownInput);

    wordCountersList.insertBefore(listItem, wordCountersList.lastElementChild);
}

// Function to create an input field
function createInput(type, placeholder, defaultValue) {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    if (defaultValue !== undefined) {
        input.value = defaultValue;
    }
    return input;
}


// Function to remove a word counter from the list
function removeWordCounter(listItem) {
    const wordCountersList = listItem.parentNode;
    wordCountersList.removeChild(listItem);
}
