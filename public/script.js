const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('WebSocket connection established');
});


socket.addEventListener('message', function (event) {
    const { channel, tags, message: msg } = JSON.parse(event.data);
    renderMessage({ channel, tags, message: msg });
});

/*
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
});*/


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

    if (message === '') return;

    messageInput.value = '';

    const data = {
        nickname: selectedNickname,
        message: message
    };


    fetch('/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            showToast('Success', 'Message sent successfully', 'green');
        } else if (response.status === 300) {

            // Handle notice received
            response.text().then(noticeMessage => {
                // Process notice message here
                console.log('Notice received: ', noticeMessage, '\nmessage: ', message, '\nnickname: ', selectedNickname);
                showToast('Notice Received', noticeMessage, 'blue');
            });

        } else {
            console.error('Failed to send message');
            showToast('Error', 'Failed to send message', 'red');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showToast('Error', 'Error sending message', 'red');
    });
    
});

// Get the input box element
const messageInput = document.getElementById('messageInput');

// Add event listener for the keydown event
messageInput.addEventListener('keydown', function(event) {
    // Check if the key pressed is Enter
    if (event.key === 'Enter') {
        // Trigger the action for sending the message
        sendButton.click(); // Assuming sendButton is the ID of your send button
    }
});

function showToast(title, text, color) {
    console.log('Showing toast:', title, text, color);

    // Create toast element
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = title + ': ' + text;
    toast.style.backgroundColor = color; // Set background color

    // Find toast container
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return; // Exit function if container not found
    }

    // Append toast to container
    container.appendChild(toast);

    // Calculate margin for toast
    const toastMargin = toast.offsetHeight+10; // Adjust as needed

    // Position toast vertically
    const numToasts = container.children.length;
    const totalMargin = (numToasts - 1) * toastMargin;
    toast.style.marginTop = `${totalMargin}px`;

    // Show toast
    setTimeout(() => {
        toast.style.opacity = '1'; // Trigger fade-in transition

        // Automatically remove toast after fade-out
        setTimeout(() => {
            if (toast.parentNode === container) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    container.removeChild(toast);
                }, 500); // Transition duration
            } else {
                console.error('Failed to remove toast from container');
            }
        }, 1000); // Display duration + transition duration
    }, 100); // Delay before showing toast
}





