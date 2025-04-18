const API_URL = "https://user-management-backend-3-s5go.onrender.com/api/users"; // Backend API URL

// Fetch and display users in a table
async function fetchUsers() {
    const res = await fetch(API_URL);
    const users = await res.json();

    const userTableBody = document.getElementById("userTableBody");
    userTableBody.innerHTML = "";

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>
                <button class="update-btn" onclick="openUpdateModal('${user._id}', '${user.name}', '${user.email}', '${user.phone}')">Update</button>
                <button class="delete-btn" onclick="deleteUser('${user._id}')">Delete</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

// Open Update Modal with user details
function openUpdateModal(id, name, email, phone) {
    document.getElementById("updateUserId").value = id;
    document.getElementById("updateName").value = name;
    document.getElementById("updateEmail").value = email;
    document.getElementById("updatePhone").value = phone;

    document.getElementById("updateModal").style.display = "block";
}

// Close the modal
function closeModal() {
    document.getElementById("updateModal").style.display = "none";
}

// Save Updated User
async function saveUpdatedUser() {
    const id = document.getElementById("updateUserId").value;
    const name = document.getElementById("updateName").value;
    const email = document.getElementById("updateEmail").value;
    const phone = document.getElementById("updatePhone").value;

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
    });

    closeModal();
    fetchUsers();
}

// Delete a user
async function deleteUser(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchUsers();
}

// Add a new user
document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
    });

    if (res.ok) {
        fetchUsers();
        document.getElementById("userForm").reset();
    }
});

// Load users on page load
fetchUsers();
