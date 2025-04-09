const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

let graph = {
  nodes: [],
  edges: [],
  directed: false,
  multigraph: false,
};

let foundPath = [];

const manualInputRadio = document.getElementById('manualInput');
const fileInputRadio = document.getElementById('fileInput');
const manualInputSection = document.getElementById('manual-input-section');
const fileInputSection = document.getElementById('file-input-section');
const uploadFileButton = document.getElementById('uploadFileButton');
const fileInput = document.getElementById('graphFile');
const fileNameDisplay = document.getElementById('fileName');

manualInputRadio.addEventListener('change', toggleInputMethod);
fileInputRadio.addEventListener('change', toggleInputMethod);

uploadFileButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileNameDisplay.textContent = `Đã chọn: ${file.name}`;
    processFile(file);
  } else {
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
  }
});

function toggleInputMethod() {
  if (manualInputRadio.checked) {
    manualInputSection.style.display = 'block';
    fileInputSection.style.display = 'none';
  } else if (fileInputRadio.checked) {
    manualInputSection.style.display = 'none';
    fileInputSection.style.display = 'block';
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
    fileInput.value = '';
  }
}

function detectGraphProperties() {
  const edgeMap = new Map();
  graph.edges.forEach(edge => {
    const key = `${edge.from}-${edge.to}`;
    const reverseKey = `${edge.to}-${edge.from}`;
    if (!edgeMap.has(key)) edgeMap.set(key, []);
    edgeMap.get(key).push(edge.weight);
    if (!edgeMap.has(reverseKey)) edgeMap.set(reverseKey, []);
  });

  // Kiểm tra đa đồ thị
  graph.multigraph = Array.from(edgeMap.values()).some(weights => weights.length > 1);

  // Kiểm tra đồ thị có hướng
  graph.directed = false;
  for (const [key, weights] of edgeMap) {
    const [from, to] = key.split('-');
    const reverseKey = `${to}-${from}`;
    const reverseWeights = edgeMap.get(reverseKey);
    if (reverseWeights.length === 0 || !weights.every(w => reverseWeights.includes(w))) {
      graph.directed = true;
      break;
    }
  }

  console.log(`Detected: Directed=${graph.directed}, Multigraph=${graph.multigraph}`);
  displayGraphType();
}

function displayGraphType() {
  let typeText = "Loại đồ thị: ";
  if (graph.multigraph) {
    typeText += "Đa đồ thị ";
  } else {
    typeText += "Đồ thị đơn ";
  }
  typeText += graph.directed ? "có hướng" : "vô hướng";
  document.getElementById('graphType').textContent = typeText;
}

function processFile(file) {
  graph.nodes = [];
  graph.edges = [];
  const nodesSet = new Set();
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'txt' || fileExtension === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      parseLines(lines, nodesSet);
      generateGraphFromNodes(nodesSet);
      detectGraphProperties();
      drawGraph();
    };
    reader.readAsText(file);
  } else if (fileExtension === 'xlsx') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      parseLines(rows.map(row => row.join(' ')), nodesSet);
      generateGraphFromNodes(nodesSet);
      detectGraphProperties();
      drawGraph();
    };
    reader.readAsArrayBuffer(file);
  } else {
    displayResult('Định dạng file không được hỗ trợ! Chỉ hỗ trợ .txt, .csv, .xlsx');
  }
}

function parseLines(lines, nodesSet) {
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/[\s,]+/);
    if (parts.length !== 3) {
      displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"`);
      return;
    }
    const [from, to, weight] = parts;
    const w = parseFloat(weight);
    if (isNaN(w)) {
      displayResult(`Lỗi: Trọng số ở dòng ${i + 1} không phải số: "${weight}"`);
      return;
    }
    nodesSet.add(from);
    nodesSet.add(to);
    graph.edges.push({ from, to, weight: w, id: `edge-${i}` });
  }
}

function parseManualInput() {
  graph.nodes = [];
  graph.edges = [];
  const nodesSet = new Set();
  const graphData = document.getElementById('graphData').value.trim();
  const lines = graphData.split('\n').filter(line => line.trim() !== '');

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length !== 3) {
      displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"`);
      return false;
    }
    const [from, to, weight] = parts;
    const w = parseFloat(weight);
    if (isNaN(w)) {
      displayResult(`Lỗi: Trọng số ở dòng ${i + 1} không phải số: "${weight}"`);
      return false;
    }
    nodesSet.add(from);
    nodesSet.add(to);
    graph.edges.push({ from, to, weight: w, id: `edge-${i}` });
  }
  generateGraphFromNodes(nodesSet);
  detectGraphProperties();
  return true;
}

function generateGraphFromNodes(nodesSet) {
  const nodesArray = Array.from(nodesSet);
  const radius = Math.min(canvas.width, canvas.height) / 2 - 50;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  graph.nodes = nodesArray.map((id, index) => {
    const angle = (index / nodesArray.length) * 2 * Math.PI;
    return {
      id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headLength = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawCurvedEdge(ctx, fromX, fromY, toX, toY, edgeIndex, totalEdges) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const offset = 20 * (edgeIndex - (totalEdges - 1) / 2);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(midX + offset, midY + offset, toX, toY);
  ctx.stroke();

  if (graph.directed) {
    const angle = Math.atan2(toY - midY, toX - midX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 10 * Math.cos(angle - Math.PI / 6), toY - 10 * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 10 * Math.cos(angle + Math.PI / 6), toY - 10 * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
}

function drawLoop(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x + 20, y - 20, 10, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const edgeGroups = {};
  graph.edges.forEach((edge, index) => {
    const key = graph.directed ? `${edge.from}-${edge.to}` : [edge.from, edge.to].sort().join('-');
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push({ ...edge, index });
  });

  for (const key in edgeGroups) {
    const edges = edgeGroups[key];
    edges.forEach((edge, idx) => {
      const fromNode = graph.nodes.find(node => node.id === edge.from);
      const toNode = graph.nodes.find(node => node.id === edge.to);
      if (fromNode && toNode) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        if (edge.from === edge.to) {
          drawLoop(ctx, fromNode.x, fromNode.y);
          ctx.fillStyle = '#000';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, fromNode.x + 20, fromNode.y - 25);
        } else if (graph.multigraph && edges.length > 1) {
          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, idx, edges.length);
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#000';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, midX + 20 * (idx - (edges.length - 1) / 2), midY);
        } else if (graph.directed) {
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#000';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, midX, midY);
        } else {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#000';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, midX, midY);
        }
      }
    });
  }

  if (foundPath.length > 0) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    for (let i = 0; i < foundPath.length - 1; i++) {
      const fromNode = graph.nodes.find(node => node.id === foundPath[i]);
      const toNode = graph.nodes.find(node => node.id === foundPath[i + 1]);
      if (fromNode && toNode) {
        if (fromNode.id === toNode.id) {
          drawLoop(ctx, fromNode.x, fromNode.y);
        } else if (graph.directed) {
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
        } else {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      }
    }
  }

  graph.nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial';
    ctx.fillText(node.id, node.x, node.y);
  });

  // Cập nhật thông tin đồ thị
  const hasNegativeWeight = graph.edges.some(edge => edge.weight < 0);
  const infoText = `Số nút: ${graph.nodes.length}\nSố cạnh: ${graph.edges.length}\nCó trọng số âm: ${hasNegativeWeight ? 'Có' : 'Không'}`;
  document.getElementById('graphInfo').textContent = infoText;
}

function displayResult(message) {
  document.getElementById('result').value = message;
}

function clearGraph() {
  graph.nodes = [];
  graph.edges = [];
  foundPath = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  displayResult('Đồ thị đã được xóa.');
  document.getElementById('graphInfo').textContent = 'Chưa có dữ liệu.';
  document.getElementById('graphType').textContent = 'Loại đồ thị: Chưa xác định';
}

function dfs(start, end) {
  const visited = new Set();
  let found = false;
  let path = [];

  function traverse(node) {
    if (visited.has(node) || found) return;
    visited.add(node);
    path.push(node);
    if (node === end) {
      found = true;
      displayResult(`DFS Path: ${path.join(' -> ')}`);
      foundPath = path.slice();
      drawGraph();
      return;
    }
    graph.edges
      .filter(edge => edge.from === node && (!graph.directed || edge.to !== node))
      .forEach(edge => traverse(edge.to));
    if (!found) path.pop();
  }
  traverse(start);
  if (!found) displayResult('DFS: Không tìm thấy đường đi');
}

function bfs(start, end) {
  const queue = [start];
  const visited = new Set();
  const prev = {};
  visited.add(start);
  let found = false;

  while (queue.length && !found) {
    const node = queue.shift();
    if (node === end) {
      found = true;
      let path = [];
      let current = node;
      while (current) {
        path.push(current);
        current = prev[current];
      }
      path.reverse();
      displayResult(`BFS Path: ${path.join(' -> ')}`);
      foundPath = path.slice();
      drawGraph();
      break;
    }
    graph.edges
      .filter(edge => edge.from === node && (!graph.directed || edge.to !== node))
      .forEach(edge => {
        const nextNode = edge.to;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          prev[nextNode] = node;
          queue.push(nextNode);
        }
      });
  }
  if (!found) displayResult('BFS: Không tìm thấy đường đi');
}

function dijkstra(start, end) {
  const distances = {};
  const prev = {};
  const pq = new Set(graph.nodes.map(node => node.id));

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  while (pq.size) {
    let minNode = Array.from(pq).reduce((a, b) => (distances[a] < distances[b] ? a : b));
    pq.delete(minNode);

    if (minNode === end) {
      let path = [];
      let current = minNode;
      while (current) {
        path.push(current);
        current = prev[current];
      }
      path.reverse();
      displayResult(`Dijkstra Path: ${path.join(' -> ')}\nTotal weight: ${distances[end]}`);
      foundPath = path.slice();
      drawGraph();
      break;
    }

    graph.edges
      .filter(edge => edge.from === minNode && (!graph.directed || edge.to !== minNode))
      .forEach(edge => {
        const neighbor = edge.to;
        if (pq.has(neighbor)) {
          const newDist = distances[minNode] + edge.weight;
          if (newDist < distances[neighbor]) {
            distances[neighbor] = newDist;
            prev[neighbor] = minNode;
          }
        }
      });
  }
  if (distances[end] === Infinity) displayResult('Dijkstra: Không tìm thấy đường đi');
}

function kruskal() {
  if (graph.directed) {
    displayResult('Kruskal chỉ áp dụng cho đồ thị vô hướng!');
    return;
  }
  const parent = {};
  const rank = {};

  function find(node) {
    if (!parent[node]) parent[node] = node;
    if (parent[node] !== node) parent[node] = find(parent[node]);
    return parent[node];
  }

  function union(node1, node2) {
    const root1 = find(node1);
    const root2 = find(node2);
    if (root1 !== root2) {
      if (!rank[root1]) rank[root1] = 0;
      if (!rank[root2]) rank[root2] = 0;
      if (rank[root1] < rank[root2]) parent[root1] = root2;
      else if (rank[root1] > rank[root2]) parent[root2] = root1;
      else {
        parent[root2] = root1;
        rank[root1]++;
      }
    }
  }

  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const mstEdges = [];
  let totalWeight = 0;

  sortedEdges.forEach(edge => {
    if (find(edge.from) !== find(edge.to)) {
      union(edge.from, edge.to);
      mstEdges.push(edge);
      totalWeight += edge.weight;
    }
  });

  foundPath = mstEdges.map(edge => [edge.from, edge.to]).flat();
  displayResult(`Kruskal MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\nTotal weight: ${totalWeight}`);
  drawGraph();
}

function prim() {
  if (graph.directed) {
    displayResult('Prim chỉ áp dụng cho đồ thị vô hướng!');
    return;
  }
  const visited = new Set();
  const mstEdges = [];
  let totalWeight = 0;

  const startNode = graph.nodes[0].id;
  visited.add(startNode);

  while (visited.size < graph.nodes.length) {
    let minEdge = null;
    let minWeight = Infinity;

    graph.edges.forEach(edge => {
      const fromIn = visited.has(edge.from);
      const toIn = visited.has(edge.to);
      if (fromIn !== toIn && edge.weight < minWeight) {
        minEdge = edge;
        minWeight = edge.weight;
      }
    });

    if (!minEdge) break;

    mstEdges.push(minEdge);
    totalWeight += minEdge.weight;
    visited.add(minEdge.from);
    visited.add(minEdge.to);
  }

  foundPath = mstEdges.map(edge => [edge.from, edge.to]).flat();
  displayResult(`Prim MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\nTotal weight: ${totalWeight}`);
  drawGraph();
}

function bellmanFord(start, end) {
  const distances = {};
  const prev = {};

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  for (let i = 0; i < graph.nodes.length - 1; i++) {
    graph.edges.forEach(edge => {
      const u = edge.from;
      const v = edge.to;
      const w = edge.weight;
      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        distances[v] = distances[u] + w;
        prev[v] = u;
      }
      if (!graph.directed && distances[v] !== Infinity && distances[v] + w < distances[u]) {
        distances[u] = distances[v] + w;
        prev[u] = v;
      }
    });
  }

  for (let edge of graph.edges) {
    const u = edge.from;
    const v = edge.to;
    const w = edge.weight;
    if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
      displayResult('Bellman-Ford: Đồ thị chứa chu trình âm!');
      return;
    }
  }

  if (distances[end] === Infinity) {
    displayResult('Bellman-Ford: Không tìm thấy đường đi!');
    return;
  }

  let path = [];
  let current = end;
  while (current) {
    path.push(current);
    current = prev[current];
  }
  path.reverse();

  displayResult(`Bellman-Ford Path: ${path.join(' -> ')}\nTotal weight: ${distances[end]}`);
  foundPath = path;
  drawGraph();
}

function floyd() {
  const dist = {};
  const next = {};

  graph.nodes.forEach(u => {
    dist[u.id] = {};
    next[u.id] = {};
    graph.nodes.forEach(v => {
      dist[u.id][v.id] = u.id === v.id ? 0 : Infinity;
      next[u.id][v.id] = null;
    });
  });

  graph.edges.forEach(edge => {
    dist[edge.from][edge.to] = edge.weight;
    next[edge.from][edge.to] = edge.to;
    if (!graph.directed) {
      dist[edge.to][edge.from] = edge.weight;
      next[edge.to][edge.from] = edge.from;
    }
  });

  graph.nodes.forEach(k => {
    graph.nodes.forEach(i => {
      graph.nodes.forEach(j => {
        if (dist[i.id][k.id] + dist[k.id][j.id] < dist[i.id][j.id]) {
          dist[i.id][j.id] = dist[i.id][k.id] + dist[k.id][j.id];
          next[i.id][j.id] = next[i.id][k.id];
        }
      });
    });
  });

  const startNode = document.getElementById('startNode').value.trim();
  const endNode = document.getElementById('endNode').value.trim();

  if (!startNode || !endNode) {
    let result = 'Floyd-Warshall Distances:\n';
    graph.nodes.forEach(u => {
      graph.nodes.forEach(v => {
        if (dist[u.id][v.id] !== Infinity && u.id !== v.id) {
          result += `${u.id} -> ${v.id}: ${dist[u.id][v.id]}\n`;
        }
      });
    });
    displayResult(result);
    return;
  }

  if (dist[startNode][endNode] === Infinity) {
    displayResult('Floyd-Warshall: Không tìm thấy đường đi!');
    return;
  }

  let path = [startNode];
  while (path[path.length - 1] !== endNode) {
    path.push(next[path[path.length - 1]][endNode]);
  }

  displayResult(`Floyd-Warshall Path: ${path.join(' -> ')}\nTotal weight: ${dist[startNode][endNode]}`);
  foundPath = path;
  drawGraph();
}

function runAlgorithm(algorithm) {
  if (!graph.nodes.length || !graph.edges.length) {
    displayResult('Vui lòng nhập dữ liệu đồ thị trước!');
    return;
  }

  const startNode = document.getElementById('startNode').value.trim();
  const endNode = document.getElementById('endNode').value.trim();

  if ((algorithm === 'dfs' || algorithm === 'bfs' || algorithm === 'dijkstra' || algorithm === 'bellmanFord' || algorithm === 'floyd') && (!startNode || !endNode)) {
    displayResult('Vui lòng nhập điểm đầu và điểm cuối!');
    return;
  }

  const startNodeExists = graph.nodes.some(node => node.id === startNode);
  const endNodeExists = graph.nodes.some(node => node.id === endNode);

  if ((algorithm === 'dfs' || algorithm === 'bfs' || algorithm === 'dijkstra' || algorithm === 'bellmanFord' || algorithm === 'floyd') && (!startNodeExists || !endNodeExists)) {
    displayResult('Điểm đầu hoặc điểm cuối không tồn tại trong đồ thị!');
    return;
  }

  // Kiểm tra trọng số âm
  const hasNegativeWeight = graph.edges.some(edge => edge.weight < 0);
  if (hasNegativeWeight) {
    if (algorithm === 'dijkstra') {
      displayResult('Dijkstra không hỗ trợ trọng số âm! Vui lòng dùng Bellman-Ford hoặc Floyd-Warshall.');
      return;
    } else if (algorithm === 'kruskal' || algorithm === 'prim') {
      displayResult(`${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} không đảm bảo kết quả đúng với trọng số âm!`);
      // Tiếp tục chạy nhưng đã cảnh báo
    }
  }

  switch (algorithm) {
    case 'dfs':
      dfs(startNode, endNode);
      break;
    case 'bfs':
      bfs(startNode, endNode);
      break;
    case 'dijkstra':
      dijkstra(startNode, endNode);
      break;
    case 'kruskal':
      kruskal();
      break;
    case 'prim':
      prim();
      break;
    case 'bellmanFord':
      bellmanFord(startNode, endNode);
      break;
    case 'floyd':
      floyd();
      break;
    default:
      displayResult('Thuật toán không hợp lệ');
  }
}

document.getElementById('run').addEventListener('click', () => {
  const algorithm = document.getElementById('algorithm').value;
  runAlgorithm(algorithm);
});

document.getElementById('drawGraphButton').addEventListener('click', () => {
  if (manualInputRadio.checked) {
    const isValidInput = parseManualInput();
    if (isValidInput) drawGraph();
  } else {
    displayResult('Vui lòng chọn file trước khi vẽ đồ thị!');
  }
});

document.getElementById('clearGraphButton').addEventListener('click', () => {
  clearGraph();
});

function resizeCanvas() {
  const outputSection = document.getElementById('output-section');
  canvas.width = outputSection.clientWidth - 20;
  canvas.height = outputSection.clientHeight - 40;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

toggleInputMethod();