let masterPassword = "";
let data = [];

window.onload = () => {
  if (!localStorage.getItem("master")) {
    masterPassword = prompt("Tạo mật khẩu chủ:");
    if (masterPassword) {
      localStorage.setItem("master", CryptoJS.SHA256(masterPassword).toString());
    } else {
      alert("Bạn phải nhập mật khẩu để sử dụng!");
      location.reload();
    }
  } else {
    let entered = prompt("Nhập mật khẩu chủ:");
    if (CryptoJS.SHA256(entered).toString() === localStorage.getItem("master")) {
      masterPassword = entered;
    } else {
      alert("Sai mật khẩu!");
      location.reload();
    }
  }

  loadData();
  renderList();
};

// Toggle Dark/Light Mode
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Tạo mật khẩu ngẫu nhiên
document.getElementById("generate").onclick = () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let pass = "";
  for (let i = 0; i < 16; i++) {
    pass += charset[Math.floor(Math.random() * charset.length)];
  }
  document.getElementById("password").value = pass;
};

// Lưu dữ liệu
document.getElementById("save").onclick = () => {
  const account = document.getElementById("account").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!account || !username || !password) return alert("Vui lòng điền đầy đủ!");

  const encrypted = CryptoJS.AES.encrypt(password, masterPassword).toString();
  data.push({ account, username, password: encrypted });
  saveData();
  renderList();
  document.getElementById("account").value = "";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
};

// Tìm kiếm
document.getElementById("search").oninput = () => {
  renderList(document.getElementById("search").value.toLowerCase());
};

// Lưu vào localStorage
function saveData() {
  localStorage.setItem("data", JSON.stringify(data));
}

// Tải dữ liệu từ localStorage
function loadData() {
  const saved = localStorage.getItem("data");
  if (saved) {
    data = JSON.parse(saved);
  }
}

// Hiển thị danh sách tài khoản
function renderList(filter = "") {
  const list = document.getElementById("password-list");
  list.innerHTML = "";
  data.forEach((item, i) => {
    if (item.account.toLowerCase().includes(filter)) {
      const div = document.createElement("div");
      div.className = "card";
      const decrypted = CryptoJS.AES.decrypt(item.password, masterPassword).toString(CryptoJS.enc.Utf8);
      div.innerHTML = `
        <strong>${item.account}</strong><br/>
        Tên đăng nhập: ${item.username}<br/>
        Mật khẩu: ${decrypted}<br/>
        <button onclick="deleteItem(${i})">Xóa</button>
      `;
      list.appendChild(div);
    }
  });
}

// Xóa tài khoản
function deleteItem(index) {
  if (confirm("Bạn có chắc muốn xóa tài khoản này không?")) {
    data.splice(index, 1);
    saveData();
    renderList();
  }
}
// Đổi mật khẩu chủ
document.getElementById("change-master").onclick = () => {
  let oldPass = prompt("Nhập mật khẩu chủ hiện tại:");
  if (CryptoJS.SHA256(oldPass).toString() !== localStorage.getItem("master")) {
    return alert("Sai mật khẩu cũ!");
  }
  let newPass = prompt("Nhập mật khẩu mới:");
  if (!newPass || newPass.length < 4) return alert("Mật khẩu quá ngắn!");

  // Giải mã toàn bộ
  data = data.map(item => {
    const decrypted = CryptoJS.AES.decrypt(item.password, masterPassword).toString(CryptoJS.enc.Utf8);
    const reEncrypted = CryptoJS.AES.encrypt(decrypted, newPass).toString();
    return { ...item, password: reEncrypted };
  });

  // Lưu lại
  masterPassword = newPass;
  localStorage.setItem("master", CryptoJS.SHA256(masterPassword).toString());
  saveData();
  renderList();
  alert("Đổi mật khẩu chủ thành công!");
};
// Backup dữ liệu
document.getElementById("backup").onclick = () => {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backup_passwords.json";
  a.click();
};

// Restore dữ liệu
document.getElementById("restore").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        if (confirm("Dữ liệu hiện tại sẽ bị thay thế. Tiếp tục?")) {
          data = imported;
          saveData();
          renderList();
          alert("Khôi phục dữ liệu thành công!");
        }
      } else {
        alert("File không hợp lệ!");
      }
    } catch (err) {
      alert("Lỗi khi đọc file!");
    }
  };
  reader.readAsText(file);
};
