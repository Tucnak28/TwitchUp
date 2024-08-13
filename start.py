import tkinter as tk
import subprocess

def getSettings(default_port="8008"):
    root = tk.Tk()
    root.withdraw()  # Hide the main window

    # Create a dialog window
    dialog = tk.Toplevel(root)
    dialog.title("Port Configuration")

    # Create a label and input box for the port number
    port_label = tk.Label(dialog, text="Enter the port number:")
    port_label.pack()
    port_entry = tk.Entry(dialog)
    port_entry.insert(0, default_port)  # Set the default port number
    port_entry.pack()

    # Create a checkbox for Discord Integration
    discord_integration_var = tk.IntVar()
    discord_integration_checkbox = tk.Checkbutton(dialog, text="Enable Discord Integration", variable=discord_integration_var)
    discord_integration_checkbox.pack()
    
    # Create a checkbox for GPT Integration
    gpt_integration_var = tk.IntVar()
    gpt_integration_checkbox = tk.Checkbutton(dialog, text="Enable GPT Integration", variable=gpt_integration_var)
    gpt_integration_checkbox.pack()

    # Define a function to capture the values and close the dialog
    def submit():
        global port, discord_integration, gpt_integration
        port = port_entry.get()
        discord_integration = discord_integration_var.get()
        gpt_integration = gpt_integration_var.get()
        dialog.destroy()

    # Create a button to submit the values
    submit_button = tk.Button(dialog, text="Submit", command=submit)
    submit_button.pack()

    # Wait for the dialog to be closed
    dialog.wait_window(dialog)

    # Return the captured values
    return port, discord_integration

port, discord_integration = getSettings()
if port:
    print(f"Selected port: {port}")
    print(f"Discord Integration enabled: {bool(discord_integration)}")

    # Pass the port number and Discord Integration status to the subprocess
    subprocess.run(["node", "index.js", str(port), str(bool(discord_integration)), str(bool(gpt_integration))])
else:
    print("No port selected")
