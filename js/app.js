// ======================
// 🔐 CONFIG
// ======================
const supabaseUrl = "https://xcuqimawoztbjwmipqmz.supabase.co";
const supabaseKey = "YOUR_KEY_HERE";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


// ======================
// 👤 REGISTER
// ======================
async function register(){

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;
  const phone = document.getElementById("phone").value;
  const msg = document.getElementById("msg");

  if(password !== confirm){
    msg.innerHTML = "❌ รหัสผ่านไม่ตรงกัน";
    return;
  }

  const { data: exist } = await supabaseClient
    .from("users")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if(exist){
    msg.innerHTML = "❌ Username ซ้ำ";
    return;
  }

  const fakeEmail = username + "@ts.com";

  const { data, error } = await supabaseClient.auth.signUp({
    email: fakeEmail,
    password: password
  });

  if(error){
    msg.innerHTML = "❌ " + error.message;
    return;
  }

  await supabaseClient.from("users").insert([{
    id: data.user.id,
    username,
    firstname,
    lastname,
    phone
  }]);

  msg.innerHTML = "✅ สมัครสำเร็จ";
}


// ======================
// 🔑 LOGIN
// ======================
async function login(){

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const fakeEmail = username + "@ts.com";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: fakeEmail,
    password: password
  });

  if(error){
    alert("❌ " + error.message);
    return;
  }

  window.location.href = "dashboard.html";
}


// ======================
// 🔐 CHECK USER
// ======================
async function checkAuth(){

  const { data: { user } } = await supabaseClient.auth.getUser();

  if(!user){
    window.location.href = "index.html";
    return null;
  }

  return user;
}


// ======================
// 👤 LOAD PROFILE
// ======================
async function loadProfile(user){

  const { data } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if(document.getElementById("usernameShow")){
    document.getElementById("usernameShow").innerText = data.username;
  }
}


// ======================
// ⏰ TIME
// ======================
function generateTime(){

  let html = '<option value="">--เลือกเวลา--</option>';

  for(let h=0;h<24;h++){
    for(let m=0;m<60;m+=15){
      let hh = String(h).padStart(2,"0");
      let mm = String(m).padStart(2,"0");
      html += `<option value="${hh}:${mm}">${hh}:${mm}</option>`;
    }
  }

  document.getElementById("check_in").innerHTML = html;
  document.getElementById("check_out").innerHTML = html;
}


// ======================
// 💾 SAVE
// ======================
async function saveAttendance(user){

  const date = document.getElementById("date_picker").value;
  const cin = document.getElementById("check_in").value;
  const cout = document.getElementById("check_out").value;
  const note = document.getElementById("remarks").value;

  let status = document.querySelector(".leave-btn.active")?.innerText || "ปกติ";

  await supabaseClient.from("attendance").insert([{
    user_id: user.id,
    date,
    check_in: cin,
    check_out: cout,
    status,
    remarks: note
  }]);

  loadAttendance(user);
}


// ======================
// 📋 LOAD
// ======================
async function loadAttendance(user){

  const { data } = await supabaseClient
    .from("attendance")
    .select(`*, users (username)`)
    .order("date", { ascending: false });

  const table = document.getElementById("tableBody");
  table.innerHTML = "";

  data.forEach(row => {

    const isOwner = row.user_id === user.id;

    table.innerHTML += `
      <tr>
        <td>${row.users?.username}</td>
        <td>${row.date}</td>
        <td>${row.check_in||"-"}</td>
        <td>${row.check_out||"-"}</td>
        <td>${row.status}</td>
        <td>${row.remarks||"-"}</td>
        <td>
          ${isOwner ? `<button onclick="deleteRow(${row.id})">ลบ</button>`:"-"}
        </td>
      </tr>
    `;
  });
}


// ======================
// 🗑️ DELETE
// ======================
async function deleteRow(id){

  await supabaseClient
    .from("attendance")
    .delete()
    .eq("id", id);

  location.reload();
}


// ======================
// 🚪 LOGOUT
// ======================
async function logout(){
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}
