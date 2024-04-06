const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('WebSocket connection established');
});


socket.addEventListener('message', function (event) {
    const { channel, tags, message: msg } = JSON.parse(event.data);
    renderMessage({ channel, tags, message: msg });
});


// Get the checkbox element
const toggleUserSelectCheckbox = document.getElementById('toggleUserSelect');

// Get the checkbox element
const toggleMessageSelectCheckbox = document.getElementById('toggleMessageSelect');

// Get the elements you want to toggle user-select on/off

// Add event listener to the checkbox
toggleUserSelectCheckbox.addEventListener('change', function() {
    // If the checkbox is checked, enable user-select
    const chatNickElements = document.querySelectorAll('.chat-nick');

    // Otherwise, disable user-select
    const userSelectValue = this.checked ? 'auto' : 'none';
    chatNickElements.forEach(function(element) {
        element.style.userSelect = userSelectValue;
    });
});

toggleMessageSelectCheckbox.addEventListener('change', function() {
    // If the checkbox is checked, enable user-select
    const chatNickElements = document.querySelectorAll('.chat-content');

    // Otherwise, disable user-select
    const userSelectValue = this.checked ? 'auto' : 'none';
    chatNickElements.forEach(function(element) {
        element.style.userSelect = userSelectValue;
    });
});


function renderMessage({ channel, tags, message }) {
    const chatDiv = document.getElementById('chatWindow');
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('chat-message');

    // Create elements for the nickname and message content
    const nickElement = document.createElement('span');
    nickElement.classList.add('chat-nick');
    nickElement.textContent = tags['display-name'];

    const messageContentElement = document.createElement('span');
    messageContentElement.classList.add('chat-content');
    messageContentElement.textContent = message;

    // Append nickname and message content to the message container
    messageContainer.appendChild(nickElement);
    messageContainer.appendChild(messageContentElement);

    // Append the message container to the chat window
    chatDiv.appendChild(messageContainer);
}

// Add event listener for "Send" button click
document.getElementById('sendButton').addEventListener('click', function() {
    // Get the value of the message input
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim(); // Trim whitespace from the message

    // Check if the message is not empty
    if (message !== '') {
        // Send the message to the server via WebSocket
        socket.send(message);

        // Clear the input field after sending the message
        messageInput.value = '';
    }
});
