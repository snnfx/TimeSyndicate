// ======================
// 🔐 INIT
// ======================
const supabaseUrl = "https://xcuqimawoztbjwmipqmz.supabase.co";
const supabaseKey = "YOUR_KEY"; // ใส่ key เดิม

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);


// ======================
// 🔑 LOGIN
// ======================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const email = username + "@ts.com";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    msg.innerHTML = "❌ " + error.message;
    return;
  }

  msg.innerHTML = "✅ เข้าสู่ระบบสำเร็จ";

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
});