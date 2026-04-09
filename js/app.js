// ======================
// 🔐 CONFIG
// ======================
const supabaseUrl = "https://xcuqimawoztbjwmipqmz.supabase.co";
const supabaseKey = "YOUR_KEY";

// 🔥 เปลี่ยนชื่อกันชนซ้ำ
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


// ======================
// 👤 REGISTER
// ======================
async function register(){

  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm = document.getElementById("confirm")?.value;
  const firstname = document.getElementById("firstname")?.value;
  const lastname = document.getElementById("lastname")?.value;
  const phone = document.getElementById("phone")?.value;
  const msg = document.getElementById("msg");

  if(!username || !password){
    msg.innerHTML = "❌ กรุณากรอกข้อมูล";
    return;
  }

  if(password !== confirm){
    msg.innerHTML = "❌ รหัสผ่านไม่ตรงกัน";
    return;
  }

  // 🔍 เช็ค username ซ้ำ
  const { data: exist } = await supabaseClient
    .from("users")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if(exist){
    msg.innerHTML = "❌ Username นี้ถูกใช้แล้ว";
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

  // 💾 บันทึก user
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

  const username = document.getElementById("username")?.value;
  const password = document.getElementById("password")?.value;

  if(!username || !password){
    alert("กรุณากรอกข้อมูล");
    return;
  }

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

  const el = document.getElementById("usernameShow");
  if(el){
    el.innerText = data.username;
  }

  return data;
}


// ======================
// ⏰ GENERATE TIME
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

  const checkInEl = document.getElementById("check_in");
  const checkOutEl = document.getElementById("check_out");

  if(checkInEl && checkOutEl){
    checkInEl.innerHTML = html;
    checkOutEl.innerHTML = html;
  }
}


// ======================
// 💾 SAVE ATTENDANCE
// ======================
async function saveAttendance(user){

  const date = document.getElementById("date_picker")?.value;
  const cin = document.getElementById("check_in")?.value;
  const cout = document.getElementById("check_out")?.value;
  const note = document.getElementById("remarks")?.value;

  let status = document.querySelector(".leave-btn.active")?.innerText || "ปกติ";

  if(!date){
    alert("กรุณาเลือกวันที่");
    return;
  }

  await supabaseClient.from("attendance").insert([{
    user_id: user.id,
    date: date,
    check_in: cin,
    check_out: cout,
    status: status,
    remarks: note
  }]);

  loadAttendance(user);
}


// ======================
// 📋 LOAD ATTENDANCE
// ======================
async function loadAttendance(user){

  const { data } = await supabaseClient
    .from("attendance")
    .select(`
      *,
      users (username, firstname, lastname)
    `)
    .order("date", { ascending: false });

  const table = document.getElementById("tableBody");
  if(!table) return;

  table.innerHTML = "";

  data.forEach(row => {

    const isOwner = row.user_id === user.id;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <a href="statistics.html?user_id=${row.user_id}">
          ${row.users?.username || "-"}
        </a>
      </td>
      <td>${row.date}</td>
      <td>${row.check_in || "-"}</td>
      <td>${row.check_out || "-"}</td>
      <td>${row.status}</td>
      <td>${row.remarks || "-"}</td>
      <td>
        ${isOwner 
          ? `<button onclick="deleteRow(${row.id})">ลบ</button>` 
          : `-`}
      </td>
    `;

    table.appendChild(tr);
  });
}


// ======================
// 🗑️ DELETE
// ======================
async function deleteRow(id){

  if(!confirm("ลบข้อมูลนี้ใช่ไหม?")) return;

  await supabaseClient
    .from("attendance")
    .delete()
    .eq("id", id);

  location.reload();
}


// ======================
// 📊 STATISTICS
// ======================
async function loadStats(){

  const params = new URLSearchParams(window.location.search);
  const user_id = params.get("user_id");

  const { data } = await supabaseClient
    .from("attendance")
    .select("*")
    .eq("user_id", user_id);

  let work=0, late=0, leave=0, absent=0, total=0;

  const table = document.getElementById("historyTable");
  if(table) table.innerHTML = "";

  data.forEach(d=>{

    if(d.status==="ปกติ") work++;
    if(d.status==="สาย") late++;
    if(d.status==="ลา") leave++;
    if(d.status==="ขาด") absent++;

    let hours = 0;

    if(d.check_in && d.check_out){
      const s = d.check_in.split(":");
      const e = d.check_out.split(":");

      const sm = s[0]*60 + +s[1];
      const em = e[0]*60 + +e[1];

      hours = (em-sm)/60;
      total += hours;
    }

    if(table){
      table.innerHTML += `
        <tr>
          <td>${d.date}</td>
          <td>${d.check_in||"-"}</td>
          <td>${d.check_out||"-"}</td>
          <td>${hours.toFixed(1)}</td>
          <td>${d.status}</td>
          <td>${d.remarks||"-"}</td>
        </tr>
      `;
    }
  });

  document.getElementById("workDays")?.innerText = "มาทำงาน: "+work+" วัน";
  document.getElementById("lateDays")?.innerText = "สาย: "+late+" วัน";
  document.getElementById("leaveDays")?.innerText = "ลา: "+leave+" วัน";
  document.getElementById("absentDays")?.innerText = "ขาด: "+absent+" วัน";
  document.getElementById("totalHours")?.innerText = "รวม: "+total.toFixed(1)+" ชม.";
}


// ======================
// 🚪 LOGOUT
// ======================
async function logout(){
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}
