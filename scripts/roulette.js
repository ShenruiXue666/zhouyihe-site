const optionListEl = document.getElementById('option-list');
const wheelCanvas = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const gptBtn = document.getElementById('gpt-btn');
const questionInput = document.getElementById('question-input');
const manualOptionInput = document.getElementById('manual-option');
const addOptionBtn = document.getElementById('add-option-btn');
const resultEl = document.getElementById('result');
const gptDescEl = document.getElementById('gpt-desc');

let options = [];
let spinning = false;

function renderOptions() {
  optionListEl.innerHTML = '';
  options.forEach((opt, idx) => {
    const span = document.createElement('span');
    span.className = 'option-item';
    span.textContent = opt;
    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.onclick = () => {
      options.splice(idx, 1);
      renderOptions();
      drawWheel();
    };
    span.appendChild(delBtn);
    optionListEl.appendChild(span);
  });
}

addOptionBtn.onclick = () => {
  const val = manualOptionInput.value.trim();
  if (val && !options.includes(val)) {
    options.push(val);
    manualOptionInput.value = '';
    renderOptions();
    drawWheel();
  }
};

gptBtn.onclick = async () => {
  const question = questionInput.value.trim();
  if (!question) {
    alert('请输入你的问题！');
    return;
  }
  gptBtn.disabled = true;
  gptBtn.textContent = '思考中...';
  gptDescEl.style.display = 'none';
  try {
    const res = await fetch('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      // 只提取“选项:”那一行
      const lines = data.choices[0].message.content.split('\n');
      const optionLine = lines.find(line => line.trim().startsWith('选项:'));
      // 显示GPT推荐介绍
      const descLines = lines.filter(line => line.trim() && !line.trim().startsWith('选项:'));
      if (descLines.length > 0) {
        gptDescEl.textContent = descLines.join('\n');
        gptDescEl.style.display = '';
      } else {
        gptDescEl.style.display = 'none';
      }
      if (optionLine) {
        const gptOptions = optionLine.replace('选项:', '').split(',').map(s => s.trim()).filter(Boolean);
        options = gptOptions;
        renderOptions();
        drawWheel();
      } else {
        alert('GPT未返回有效选项行');
      }
    } else {
      alert('GPT未返回有效选项');
    }
  } catch (e) {
    alert('请求失败: ' + e.message);
  } finally {
    gptBtn.disabled = false;
    gptBtn.textContent = '让GPT帮我想';
  }
};

function drawWheel() {
  const ctx = wheelCanvas.getContext('2d');
  const size = wheelCanvas.width;
  ctx.clearRect(0, 0, size, size);
  const n = options.length;
  if (n === 0) return;
  const angle = 2 * Math.PI / n;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(size/2, size/2);
    ctx.arc(size/2, size/2, size/2-10, i*angle, (i+1)*angle);
    ctx.closePath();
    ctx.fillStyle = `hsl(${i*360/n}, 70%, 80%)`;
    ctx.fill();
    ctx.save();
    ctx.translate(size/2, size/2);
    ctx.rotate(i*angle + angle/2);
    ctx.textAlign = 'right';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(options[i], size/2-30, 8);
    ctx.restore();
  }
  // 画指针
  ctx.beginPath();
  ctx.moveTo(size/2, 10);
  ctx.lineTo(size/2-15, 40);
  ctx.lineTo(size/2+15, 40);
  ctx.closePath();
  ctx.fillStyle = '#f44';
  ctx.fill();
}

drawWheel();

spinBtn.onclick = () => {
  if (spinning || options.length === 0) return;
  spinning = true;
  resultEl.textContent = '';
  let start = 0;
  const n = options.length;
  const angle = 2 * Math.PI / n;
  const winner = Math.floor(Math.random() * n);
  const finalAngle = (3 * 2 * Math.PI) + (winner + Math.random()) * angle; // 多转几圈
  let t = 0;
  function animate() {
    t += 1;
    const progress = Math.min(t/80, 1);
    const ease = 1 - Math.pow(1-progress, 3);
    const currentAngle = start + (finalAngle - start) * ease;
    const ctx = wheelCanvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    ctx.translate(wheelCanvas.width/2, wheelCanvas.height/2);
    ctx.rotate(currentAngle);
    ctx.translate(-wheelCanvas.width/2, -wheelCanvas.height/2);
    drawWheel();
    ctx.restore();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      resultEl.textContent = '🎉 结果：' + options[winner];
    }
  }
  animate();
}; 