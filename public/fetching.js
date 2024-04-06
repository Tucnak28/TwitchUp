fetch('/configs') // Make a GET request to the '/configs' endpoint
    .then(response => response.json()) // Parse the JSON response
    .then(configs => {
        // Create the <tbody> element to hold the table rows
        const tbody = document.querySelector('#accountsTable tbody');

        // Loop through the fetched configurations
        configs.forEach((config, index) => {
            // Create a new <tr> element for each configuration
            const accountTr = document.createElement('tr');

            // Create the <td> elements for nickname and token
            const nicknameTd = document.createElement('td');
            const tokenTd = document.createElement('td');

            // Create <input> elements and set their attributes
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

            // Append the <input> elements to the corresponding <td> elements
            nicknameTd.appendChild(nicknameInput);
            tokenTd.appendChild(tokenInput);

            // Append the <td> elements to the <tr> element
            accountTr.appendChild(nicknameTd);
            accountTr.appendChild(tokenTd);

            // Append the <tr> element to the <tbody> of the table
            tbody.appendChild(accountTr);
        });
    })
    .catch(error => {
        console.error('Error fetching IRC configs:', error);
    });
