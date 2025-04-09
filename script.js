const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// Cấu hình đồ thị
let graph = {
  nodes: [],
  edges: [],
};

let foundPath = [];

// Xử lý radio button
const manualInputRadio = document.getElementById('manualInput');
const fileInputRadio = document.getElementById('fileInput');
const manualInputSection = document.getElementById('manual-input-section');
const fileInputSection = document.getElementById('file-input-section');
const uploadFileButton = document.getElementById('uploadFileButton');
const fileInput = document.getElementById('graphFile');
const fileNameDisplay = document.getElementById('fileName');

manualInputRadio.addEventListener('change', toggleInputMethod);
fileInputRadio.addEventListener('change', toggleInputMethod);

uploadFileButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileNameDisplay.textContent = `Đã chọn: ${file.name}`;
    console.log('File selected:', file.name);
    processFile(file);
  } else {
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
    console.log('No file selected');
  }
});

function toggleInputMethod() {
  if (manualInputRadio.checked) {
    manualInputSection.style.display = 'block';
    fileInputSection.style.display = 'none';
    console.log('Switched to manual input');
  } else if (fileInputRadio.checked) {
    manualInputSection.style.display = 'none';
    fileInputSection.style.display = 'block';
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
    fileInput.value = '';
    console.log('Switched to file input');
  }
}

// Hàm xử lý file (txt, csv, xlsx)
function processFile(file) {
  graph.nodes = [];
  graph.edges = [];
  const nodesSet = new Set();

  const fileExtension = file.name.split('.').pop().toLowerCase();
  console.log('File extension:', fileExtension);

  if (fileExtension === 'txt' || fileExtension === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      console.log('File content:', lines);

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(/[\s,]+/);
        if (parts.length !== 3) {
          displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"\nĐịnh dạng đúng: A B 3 hoặc A,B,3`);
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
        graph.edges.push({ from, to, weight: w });
      }
      generateGraphFromNodes(nodesSet);
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
      console.log('Excel rows:', rows);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) {
          displayResult(`Lỗi: Dòng ${i + 1} trong Excel không đủ 3 cột (from, to, weight)`);
          return;
        }
        const [from, to, weight] = row;
        const w = parseFloat(weight);
        if (isNaN(w)) {
          displayResult(`Lỗi: Trọng số ở dòng ${i + 1} không phải số: "${weight}"`);
          return;
        }
        nodesSet.add(from.toString());
        nodesSet.add(to.toString());
        graph.edges.push({ from: from.toString(), to: to.toString(), weight: w });
      }
      generateGraphFromNodes(nodesSet);
      drawGraph();
    };
    reader.readAsArrayBuffer(file);
  } else {
    displayResult('Định dạng file không được hỗ trợ! Chỉ hỗ trợ .txt, .csv, .xlsx');
  }
}

// Hàm xử lý dữ liệu nhập tay
function parseManualInput() {
  graph.nodes = [];
  graph.edges = [];
  const nodesSet = new Set();

  const graphData = document.getElementById('graphData').value.trim();
  const lines = graphData.split('\n').filter(line => line.trim() !== '');
  console.log('Manual input data:', lines);

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length !== 3) {
      displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"\nĐịnh dạng đúng: A B 3`);
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
    graph.edges.push({ from, to, weight: w });
  }
  generateGraphFromNodes(nodesSet);
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
  console.log('Generated nodes:', graph.nodes);
  console.log('Edges:', graph.edges);
}

// Vẽ đồ thị
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  graph.edges.forEach(edge => {
    const fromNode = graph.nodes.find(node => node.id === edge.from);
    const toNode = graph.nodes.find(node => node.id === edge.to);

    if (fromNode && toNode) {
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();

      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(edge.weight, midX, midY);
    }
  });

  if (foundPath.length > 0) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    for (let i = 0; i < foundPath.length - 1; i++) {
      const fromNode = graph.nodes.find(node => node.id === foundPath[i]);
      const toNode = graph.nodes.find(node => node.id === foundPath[i + 1]);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
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
  console.log('Graph drawn');
}

function displayResult(message) {
  document.getElementById('result').value = message;
  console.log('Result displayed:', message);
}

// Hàm xóa đồ thị
function clearGraph() {
  graph.nodes = [];
  graph.edges = [];
  foundPath = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  displayResult('Đồ thị đã được xóa.');
  console.log('Graph cleared');
}

// Thuật toán DFS
function dfs(start, end) {
  const visited = new Set();
  let found = false;
  let path = [];

  function traverse(node) {
    if (visited.has(node) || found) return;
    visited.add(node);
    path.push(node);
    console.log('DFS visiting:', node);
    if (node === end) {
      found = true;
      displayResult(`DFS Path: ${path.join(' -> ')}`);
      foundPath = path.slice();
      drawGraph();
      return;
    }
    graph.edges
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => {
        const nextNode = edge.from === node ? edge.to : edge.from;
        traverse(nextNode);
      });
    if (!found) path.pop();
  }
  traverse(start);
  if (!found) displayResult('DFS: Không tìm thấy đường đi');
}

// Thuật toán BFS
function bfs(start, end) {
  const queue = [start];
  const visited = new Set();
  const prev = {};
  visited.add(start);
  let found = false;

  while (queue.length && !found) {
    const node = queue.shift();
    console.log('BFS visiting:', node);
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
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => {
        const nextNode = edge.from === node ? edge.to : edge.from;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          prev[nextNode] = node;
          queue.push(nextNode);
        }
      });
  }
  if (!found) displayResult('BFS: Không tìm thấy đường đi');
}

// Thuật toán Dijkstra
function dijkstra(start, end) {
  const distances = {};
  const prev = {};
  const pq = new Set(graph.nodes.map(node => node.id));

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  while (pq.size) {
    let minNode = Array.from(pq).reduce((a, b) => (distances[a] < distances[b] ? a : b));
    pq.delete(minNode);
    console.log('Dijkstra visiting:', minNode, 'Distance:', distances[minNode]);

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
      .filter(edge => edge.from === minNode || edge.to === minNode)
      .forEach(edge => {
        const neighbor = edge.from === minNode ? edge.to : edge.from;
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

// Thuật toán Kruskal (Tìm cây khung nhỏ nhất - MST)
function kruskal() {
  const parent = {};
  const rank = {};

  // Hàm tìm gốc (find) với nén đường
  function find(node) {
    if (!parent[node]) parent[node] = node;
    if (parent[node] !== node) parent[node] = find(parent[node]);
    return parent[node];
  }

  // Hàm gộp hai tập hợp (union)
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

  // Sắp xếp cạnh theo trọng số
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

// Thuật toán Prim (Tìm cây khung nhỏ nhất - MST)
function prim() {
  const visited = new Set();
  const mstEdges = [];
  let totalWeight = 0;

  // Bắt đầu từ node đầu tiên
  const startNode = graph.nodes[0].id;
  visited.add(startNode);

  while (visited.size < graph.nodes.length) {
    let minEdge = null;
    let minWeight = Infinity;

    // Tìm cạnh có trọng số nhỏ nhất từ tập visited đến chưa visited
    graph.edges.forEach(edge => {
      const fromIn = visited.has(edge.from);
      const toIn = visited.has(edge.to);
      if (fromIn !== toIn && edge.weight < minWeight) {
        minEdge = edge;
        minWeight = edge.weight;
      }
    });

    if (!minEdge) break; // Không còn cạnh nào nối được

    mstEdges.push(minEdge);
    totalWeight += minEdge.weight;
    visited.add(minEdge.from);
    visited.add(minEdge.to);
  }

  foundPath = mstEdges.map(edge => [edge.from, edge.to]).flat();
  displayResult(`Prim MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\nTotal weight: ${totalWeight}`);
  drawGraph();
}

// Thuật toán Bellman-Ford (Đường đi ngắn nhất từ một nguồn)
function bellmanFord(start, end) {
  const distances = {};
  const prev = {};

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  // Thư giãn các cạnh (V-1 lần)
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    graph.edges.forEach(edge => {
      const u = edge.from;
      const v = edge.to;
      const w = edge.weight;
      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        distances[v] = distances[u] + w;
        prev[v] = u;
      }
      // Đồ thị vô hướng, kiểm tra cả chiều ngược lại
      if (distances[v] !== Infinity && distances[v] + w < distances[u]) {
        distances[u] = distances[v] + w;
        prev[u] = v;
      }
    });
  }

  // Kiểm tra chu trình âm
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

// Thuật toán Floyd-Warshall (Đường đi ngắn nhất giữa tất cả các cặp đỉnh)
function floyd() {
  const dist = {};
  const next = {};

  // Khởi tạo ma trận khoảng cách
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
    dist[edge.to][edge.from] = edge.weight; // Đồ thị vô hướng
    next[edge.from][edge.to] = edge.to;
    next[edge.to][edge.from] = edge.from;
  });

  // Floyd-Warshall
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

// Chạy thuật toán
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

  console.log('Running algorithm:', algorithm, 'from', startNode || 'N/A', 'to', endNode || 'N/A');
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

// Lắng nghe sự kiện
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

// Khởi tạo canvas
function resizeCanvas() {
  const outputSection = document.getElementById('output-section');
  canvas.width = outputSection.clientWidth - 20;
  canvas.height = outputSection.clientHeight - 40;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Khởi tạo trạng thái ban đầu
toggleInputMethod();