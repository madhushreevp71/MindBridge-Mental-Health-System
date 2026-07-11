
const USERS={
  students:[
    {email:'alice@gmail.com',pass:'pass123',name:'Alice Johnson'},
    {email:'bob@gmail.com',pass:'pass123',name:'Bob Smith'}
  ],
  doctors:[
    {email:'dr.green@gmail.com',pass:'doc123',name:'Dr. Green'}
  ]
};

let currentRole='student';
let currentUser=null;

function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function selRole(r){
  currentRole=r;
  document.getElementById('rc-student').classList.toggle('sel',r==='student');
  document.getElementById('rc-doctor').classList.toggle('sel',r==='doctor');
}
function goLogin(){
  document.getElementById('login-title').textContent=currentRole==='doctor'?'Doctor Login':'Student Login';
  document.getElementById('login-icon').textContent=currentRole==='doctor'?'🩺':'🎓';
  document.getElementById('login-msg').innerHTML='';
  go('s-login');
}
function goSignup(){go('s-signup')}
function goForgot(){document.getElementById('fp-msg').innerHTML='';go('s-forgot')}
function logout(){currentUser=null;go('s-landing')}

function suRole(r){
  currentRole=r;
  document.getElementById('su-tab-s').classList.toggle('active',r==='student');
  document.getElementById('su-tab-d').classList.toggle('active',r==='doctor');
}

function msg(id,text,type){
  document.getElementById(id).innerHTML=`<div class="${type==='err'?'err':'suc'}">${text}</div>`;
}

function validEmail(e){return /^[^\s@]+@gmail\.com$/i.test(e.trim())}

function doLogin(){
  const em=document.getElementById('login-email').value.trim();
  const pw=document.getElementById('login-pass').value;
  if(!em){return msg('login-msg','Please enter your email.','err')}
  if(!validEmail(em)){return msg('login-msg','Only @gmail.com addresses are accepted.','err')}
  if(!pw){return msg('login-msg','Please enter your password.','err')}
  const pool=currentRole==='doctor'?USERS.doctors:USERS.students;
  const found=pool.find(u=>u.email.toLowerCase()===em.toLowerCase());
  if(!found){return msg('login-msg','Account does not exist, please sign up.','err')}
  if(found.pass!==pw){return msg('login-msg','Incorrect password. Please try again.','err')}
  currentUser=found;
  if(currentRole==='student'){loadStudentDash();go('s-student');}
  else{loadDoctorDash();go('s-doctor');}
}

function doSignup(){
  const name=document.getElementById('su-name').value.trim();
  const em=document.getElementById('su-email').value.trim();
  const pw=document.getElementById('su-pass').value;
  if(!name){return msg('su-msg','Please enter your name.','err')}
  if(!validEmail(em)){return msg('su-msg','Only @gmail.com addresses are accepted.','err')}
  if(pw.length<8){return msg('su-msg','Password must be at least 8 characters.','err')}
  const pool=currentRole==='doctor'?USERS.doctors:USERS.students;
  if(pool.find(u=>u.email.toLowerCase()===em.toLowerCase())){return msg('su-msg','Account already exists. Please sign in.','err')}
  pool.push({email:em,pass:pw,name});
  msg('su-msg','Account created! You can now sign in.','suc');
  setTimeout(()=>goLogin(),1500);
}

function doForgot(){
  const em=document.getElementById('fp-email').value.trim();
  if(!validEmail(em)){return msg('fp-msg','Please enter a valid @gmail.com address.','err')}
  const all=[...USERS.students,...USERS.doctors];
  if(!all.find(u=>u.email.toLowerCase()===em.toLowerCase())){return msg('fp-msg','Account does not exist, please sign up.','err')}
  msg('fp-msg','Password reset link sent to '+em+'. Check your inbox.','suc');
}

/* ===== STUDENT DASHBOARD ===== */
const TIPS=[
  'Practice 4-7-8 breathing: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3 times to activate your parasympathetic nervous system.',
  'Take a 10-minute walk outside. Natural light and movement significantly reduce cortisol levels.',
  'Write three things you\'re grateful for. Gratitude journaling rewires neural pathways toward positivity.',
  'Limit screen time 1 hour before bed. Blue light suppresses melatonin and disrupts restorative sleep.',
];
const QUOTES=[
  '"You don\'t have to be positive all the time. It\'s perfectly okay to feel sad, angry, or anxious." — Lori Deschene',
  '"Self-care is how you take your power back." — Lalah Delia',
  '"The greatest glory in living lies not in never falling, but in rising every time we fall." — Nelson Mandela',
  '"You are enough just as you are." — Megan Markle',
];
const REMINDERS=[
  {text:'Drink 8 glasses of water',done:false},
  {text:'10 min meditation',done:false},
  {text:'Stretch or light exercise',done:false},
  {text:'Call a friend or family',done:false},
  {text:'Journal entry',done:false},
];

let moodSel=null;
function selMood(el,em){
  document.querySelectorAll('.mood-emoji').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
  moodSel=em;
  const labels={
    '😔':'Feeling low today — you\'re seen and supported.',
    '😐':'Neutral — steady is okay too.',
    '🙂':'Doing okay — keep going!',
    '😊':'Good vibes! Great day ahead.',
    '😄':'Excellent mood — spread the positivity!'
  };
  document.getElementById('mood-label').textContent=labels[em];
  renderWeekChart();
}

function renderWeekChart(){
  const vals=[62,45,70,38,80,55,moodSel?{
    '😔':20,'😐':40,'🙂':60,'😊':80,'😄':95
  }[moodSel]:50];
  const colors=['#5DCAA5','#FAEEDA','#1D9E75','#FAECE7','#9FE1CB','#5DCAA5','#1D9E75'];
  const ch=document.getElementById('week-chart');
  ch.innerHTML=vals.map((v,i)=>`<div class="wc-bar-wrap"><div class="wc-bar" style="height:${v*0.6}%;background:${colors[i]};min-height:4px"></div></div>`).join('');
}

function loadStudentDash(){
  document.getElementById('st-name').textContent=currentUser.name;
  renderWeekChart();
  renderReminders();
  const ti=Math.floor(Math.random()*TIPS.length);
  document.getElementById('daily-tip').textContent=TIPS[ti];
  document.getElementById('daily-quote').textContent=QUOTES[ti];
  initChat();
}

function renderReminders(){
  const el=document.getElementById('reminder-list');
  el.innerHTML=REMINDERS.map((r,i)=>`<div class="reminder-item${r.done?' done':''}" onclick="toggleReminder(${i})"><div class="r-check">${r.done?'✓':''}</div><span>${r.text}</span></div>`).join('');
}
function toggleReminder(i){REMINDERS[i].done=!REMINDERS[i].done;renderReminders()}

/* ===== CHATBOT ===== */
const BOT_RESPONSES={
  sad:['I hear you. Feeling sad is a natural human experience. Would you like to try a grounding exercise together?','It takes courage to acknowledge difficult feelings. I\'m here with you. What\'s been weighing on your mind?'],
  anxious:['Anxiety can feel overwhelming, but remember — it always passes. Let\'s try: name 5 things you can see right now.','You\'re safe right now. Try taking a slow breath in for 4 counts, hold 4, out for 6. Better?'],
  stressed:['Stress often tells us something matters to us. What\'s the main source today?','When we\'re stressed, breaking tasks into small steps helps. What\'s the one smallest thing you could do right now?'],
  happy:['That\'s wonderful to hear! What\'s contributing to your good mood today?','I love hearing that! Positive moments are worth celebrating. What happened?'],
  default:['Thank you for sharing that with me. Tell me more — I\'m here to listen.','I appreciate you opening up. How long have you been feeling this way?','You\'re not alone in this. What kind of support would feel most helpful right now?']
};

let chatHistory=[];
function initChat(){
  chatHistory=[];
  document.getElementById('chat-msgs').innerHTML='';
  addBotMsg('Hi '+currentUser.name.split(' ')[0]+'! 👋 I\'m your AI support companion. How are you feeling today?');
}

function addBotMsg(text){
  const d=document.getElementById('chat-msgs');
  const m=document.createElement('div');
  m.className='chat-msg bot';
  m.textContent=text;
  d.appendChild(m);
  d.scrollTop=d.scrollHeight;
}
function addUserMsg(text){
  const d=document.getElementById('chat-msgs');
  const m=document.createElement('div');
  m.className='chat-msg user';
  m.textContent=text;
  d.appendChild(m);
  d.scrollTop=d.scrollHeight;
}

function analyze(text){
  const t=text.toLowerCase();
  if(/sad|depress|cry|unhappy|down/.test(t))return 'sad';
  if(/anxious|anxiety|worry|panic|nervous/.test(t))return 'anxious';
  if(/stress|overwhelm|pressure|burden/.test(t))return 'stressed';
  if(/happy|good|great|wonderful|excited|joy/.test(t))return 'happy';
  return 'default';
}

async function sendChat(){
  const inp=document.getElementById('chat-in');
  const text=inp.value.trim();
  if(!text)return;
  inp.value='';
  addUserMsg(text);
  const typing=document.getElementById('chat-typing');
  typing.textContent='MindBridge is typing…';
  
  await new Promise(r=>setTimeout(r,900+Math.random()*800));
  
  const sentiment=analyze(text);
  const pool=BOT_RESPONSES[sentiment];
  const reply=pool[Math.floor(Math.random()*pool.length)];
  typing.textContent='';
  addBotMsg(reply);
  
  // Auto-suggest if crisis keywords detected
  if(/suicide|self-harm|hurt myself|end it|hopeless/.test(text.toLowerCase())){
    setTimeout(()=>addBotMsg('I\'m concerned about you. Please reach out to iCall at 9152987821 (India) — trained counsellors are available 24/7. You matter.'),600);
  }
}

/* ===== QUESTIONNAIRE ===== */
const QUESTIONS=[
  {q:'Over the past 2 weeks, how often have you had little interest or pleasure in doing things?',scale:'PHQ-9'},
  {q:'Feeling down, depressed, or hopeless?',scale:'PHQ-9'},
  {q:'Trouble falling or staying asleep, or sleeping too much?',scale:'PHQ-9'},
  {q:'Feeling tired or having little energy?',scale:'PHQ-9'},
  {q:'Feeling nervous, anxious, or on edge?',scale:'GAD-7'},
  {q:'Not being able to stop or control worrying?',scale:'GAD-7'},
  {q:'Worrying too much about different things?',scale:'GAD-7'},
  {q:'Trouble relaxing?',scale:'GAD-7'},
];
const OPTS=['Not at all','Several days','More than half the days','Nearly every day'];
let qAnswers={};

function openQModal(){
  qAnswers={};
  const c=document.getElementById('q-content');
  c.innerHTML=QUESTIONS.map((q,i)=>`
    <div class="q-item">
      <label><span style="font-size:10px;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px">${q.scale}</span><br>${q.q}</label>
      <div class="q-options">${OPTS.map((o,j)=>`<div class="q-opt" onclick="selQ(${i},${j},this)">${o}</div>`).join('')}</div>
    </div>
  `).join('');
  document.getElementById('q-result').style.display='none';
  document.getElementById('q-btn').style.display='block';
  document.getElementById('q-modal').style.display='flex';
}
function closeQModal(){document.getElementById('q-modal').style.display='none'}
function selQ(i,j,el){
  qAnswers[i]=j;
  el.closest('.q-options').querySelectorAll('.q-opt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');
}
function submitQ(){
  if(Object.keys(qAnswers).length<QUESTIONS.length){alert('Please answer all questions.');return}
  const phq=([0,1,2,3].reduce((s,i)=>s+(qAnswers[i]||0),0));
  const gad=([4,5,6,7].reduce((s,i)=>s+(qAnswers[i]||0),0));
  document.getElementById('phq-score').textContent=phq;
  document.getElementById('gad-score').textContent=gad;
  const total=phq+gad;
  const pct=Math.round((total/42)*100);
  updateStress(pct);
  const box=document.getElementById('q-result');
  box.style.display='block';
  let level,color;
  if(total<=10){level='Mild — good to hear! Keep up healthy habits.';color='var(--green)'}
  else if(total<=20){level='Moderate — consider speaking to someone you trust.';color='var(--amber)'}
  else{level='Severe — please reach out to our counselling team soon.';color='var(--red)'}
  box.innerHTML=`<div style="background:var(--bg2);border-radius:var(--r);padding:14px">
    <p style="font-size:13px;font-weight:500;color:${color}">${level}</p>
    <p style="font-size:12px;color:var(--tx2);margin-top:6px">PHQ-9: ${phq}/27 · GAD-7: ${gad}/21</p>
  </div>`;
  document.getElementById('q-btn').style.display='none';
}
function updateStress(pct){
  const b=document.getElementById('stress-bar');
  const pb=document.getElementById('stress-pct');
  const ba=document.getElementById('stress-badge');
  const sb=document.getElementById('stress-box');
  b.style.width=pct+'%';
  pb.textContent=pct+'%';
  sb.className=pct<35?'stress-low':pct<65?'stress-med':'stress-high';
  if(pct<35){ba.textContent='Low';ba.className='badge badge-success';pb.style.color='var(--teal)'}
  else if(pct<65){ba.textContent='Moderate';ba.className='badge badge-warn';pb.style.color='var(--amber)'}
  else{ba.textContent='High';ba.className='badge badge-danger';pb.style.color='var(--coral)'}
}

/* ===== DOCTOR DASHBOARD ===== */
const STUDENTS=[
  {name:'Arjun Mehta',phq:18,gad:15,last:'Today'},
  {name:'Priya Sharma',phq:5,gad:4,last:'Yesterday'},
  {name:'Sneha Rao',phq:12,gad:16,last:'Today'},
  {name:'Rahul Verma',phq:9,gad:8,last:'2 days ago'},
  {name:'Meera Nair',phq:3,gad:2,last:'Today'},
  {name:'Karan Singh',phq:15,gad:13,last:'Yesterday'},
];

function severity(phq,gad){
  const t=phq+gad;
  if(t>=25)return{label:'Severe',cls:'badge-danger'};
  if(t>=15)return{label:'Moderate',cls:'badge-warn'};
  return{label:'Mild',cls:'badge-success'};
}

function loadDoctorDash(){
  document.getElementById('dr-name').textContent=currentUser.name;
  const tb=document.getElementById('student-tbody');
  tb.innerHTML=STUDENTS.map((s,i)=>{
    const sv=severity(s.phq,s.gad);
    const action=sv.label==='Severe'
      ?`<button class="appt-btn" onclick="scheduleAppt('${s.name}')">Schedule appt</button>`
      :`<button class="rec-btn" onclick="showRec('${s.name}',${i})">Recommend activities</button>`;
    return`<tr><td>${s.name}</td><td>${s.phq}</td><td>${s.gad}</td><td><span class="badge ${sv.cls}">${sv.label}</span></td><td style="color:var(--tx2);font-size:12px">${s.last}</td><td>${action}</td></tr>`;
  }).join('');
}

function scheduleAppt(name){
  alert('Appointment request sent to '+name+'. They will receive a notification to confirm.');
}

const RECS=[
  ['5-minute guided meditation 🧘','Progressive muscle relaxation 💆','Mindful colouring for 15 minutes 🎨'],
  ['30-min nature walk 🌿','Light yoga session 🤸','Dance to your favourite playlist 💃'],
  ['Call a supportive friend 📞','Write in a gratitude journal 📖','Watch a comforting film 🎬'],
  ['Bake something simple 🍞','Tend to plants or garden 🌱','Creative writing or drawing ✏️'],
];
function showRec(name,idx){
  const list=document.getElementById('rec-list');
  const recs=RECS[idx%RECS.length];
  list.innerHTML=recs.map(r=>`<div style="padding:12px;background:var(--green-l);border-radius:var(--r);font-size:13px;color:var(--green)">${r}</div>`).join('');
  document.getElementById('rec-modal').style.display='flex';
}

/* init */
renderWeekChart();
